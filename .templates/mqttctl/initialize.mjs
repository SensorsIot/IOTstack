// Runs once before the broker. Existing broker configuration and credentials
// survive recreation; only the public URL is synchronized on subsequent runs.
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';

const root = '/state';
const password = process.env.MQTTCTL_ADMIN_PASSWORD;
const publicUrl = new URL(process.env.MQTTCTL_PUBLIC_URL);
if (!['http:', 'https:'].includes(publicUrl.protocol) ||
    publicUrl.pathname !== '/' || publicUrl.search || publicUrl.hash ||
    publicUrl.username || publicUrl.password) {
  throw new Error('MQTTCTL_PUBLIC_URL must be an HTTP(S) origin without a path');
}
if (!password) throw new Error('MQTTCTL_ADMIN_PASSWORD must not be empty');
process.umask(0o077);
for (const directory of ['app-config', 'app-data', 'agent-config', 'broker-config', 'broker-data', 'public-certs']) {
  fs.mkdirSync(path.join(root, directory), { recursive: true });
}
// Mosquitto drops privileges to UID/GID 1883 in the pinned broker image.
for (const directory of ['broker-config', 'broker-data']) {
  fs.chownSync(path.join(root, directory), 1883, 1883);
}
const writeJson = (file, value) => {
  const target = path.join(root, file);
  fs.writeFileSync(target + '.tmp', JSON.stringify(value, null, 2) + '\n', { mode: 0o600 });
  fs.renameSync(target + '.tmp', target);
};
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const exists = (file) => fs.existsSync(path.join(root, file));
const random = () => crypto.randomBytes(32).toString('hex');
const secretsFile = 'app-config/mqttctl.secrets.json';
if (!exists(secretsFile)) {
  // Refuse to silently replace credentials for an existing broker or app DB.
  if (exists('broker-data/dynamic-security.json') || exists('app-data/mqttctl.sqlite') ||
      exists('agent-config/broker-agent.config.json')) {
    throw new Error('mqttctl secrets are missing from an existing installation; restore them from backup');
  }
  writeJson(secretsFile, {
    sessionSecret: random(),
    broker: { dynsecAdminPassword: random(), agentApiKey: random() },
    bootstrapAdmin: { username: 'admin', password }
  });
}
const secrets = readJson(secretsFile);
const keyFiles = {
  caFile: '/mosquitto/config/certs/ca/ca.crt',
  mosquittoPublicKey: '/mosquitto/config/certs/mosquitto/tls.crt',
  brokerPublicKey: '/mosquitto/config/certs/broker-agent/tls.crt'
};
const brokerPaths = {
  mainConfigPath: '/mosquitto/config/mosquitto.conf',
  dynsecStateFilePath: '/mosquitto/data/dynamic-security.json',
  keyFiles
};
const configFile = 'app-config/mqttctl.config.json';
const config = exists(configFile) ? readJson(configFile) : {
  auth: { localEnabled: true, oidcEnabled: false, headerEnabled: false },
  broker: {
    ...brokerPaths,
    host: 'mqttctl-broker-agent', port: 8883,
    dynsecAdminUsername: 'admin',
    agent: { baseUrl: 'https://mqttctl-broker-agent:3943', insecure: false },
    tls: { enabled: true, caFile: keyFiles.caFile, insecure: false }
  }
};
config.publicBaseUrl = publicUrl.origin;
writeJson(configFile, config);
if (!exists('agent-config/broker-agent.config.json')) {
  writeJson('agent-config/broker-agent.config.json', {
    listen: {
      http: { enabled: false, host: '0.0.0.0', port: 3900 },
      https: { enabled: true, host: '0.0.0.0', port: 3943,
        certFile: keyFiles.brokerPublicKey,
        keyFile: '/mosquitto/config/certs/broker-agent/tls.key' }
    },
    auth: { apiKey: secrets.broker.agentApiKey },
    broker: {
      ...brokerPaths,
      command: ['/usr/sbin/mosquitto', '-c', brokerPaths.mainConfigPath],
      dynsecBootstrap: { username: 'admin', password: secrets.broker.dynsecAdminPassword }
    }
  });
}
if (!exists('broker-config/mosquitto.conf')) {
  fs.copyFileSync('/iotstack/mosquitto.conf', path.join(root, 'broker-config/mosquitto.conf'));
  fs.chmodSync(path.join(root, 'broker-config/mosquitto.conf'), 0o644);
}
console.log('mqttctl configuration ready; existing credentials and broker configuration preserved.');
