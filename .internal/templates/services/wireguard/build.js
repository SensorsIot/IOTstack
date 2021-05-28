const path = require('path');

const ServiceBuilder = ({
  settings,
  version,
  logger
}) => {
  const retr = {};
  const serviceName = 'wireguard';

  const { byName } = require('../../../src/utils/interpolate');

  const {
    setModifiedPorts,
    setLoggingState,
    setNetworkMode,
    setNetworks,
    setEnvironmentVariables,
    setDevices
  } = require('../../../src/utils/commonCompileLogic');

  const {
    checkPortConflicts,
    getSetPortsByConfigName,
    checkNetworkConflicts,
    checkDependencyServices
  } = require('../../../src/utils/commonBuildChecks');

  /*
    Order:
      1. compile() - merges build options into the final JSON output.
      2. issues()  - runs checks on the compile()'ed JSON, and can also test for errors.
      3. assume()  - sets required default values if they are not specified in compile(). Once defaults are set, it reruns compile(). This function is optional
      4. build()   - sets up scripts and files.
  */

  retr.init = () => {
    logger.debug(`ServiceBuilder:init() - '${serviceName}'`);
  };

  const checkServiceFilesCopied = () => {
    return `
if [[ ! -f ./services/wireguard/wg0.conf ]]; then
  echo "Wireguard config file is missing!"
  sleep 2
fi
`;
  };

  const createVolumesDirectory = () => {
    return `
mkdir -p ./services/wireguard/config
`;
  };

  const checkVolumesDirectory = () => {
    return `
if [[ ! -d ./services/wireguard/config ]]; then
  echo "Wireguard directory is missing!"
  sleep 2
fi
`;
  };

  retr.compile = ({
    outputTemplateJson,
    buildOptions,
  }) => {
    return new Promise((resolve, reject) => {
      try {
        console.info(`ServiceBuilder:compile() - '${serviceName}' started`);

        const compileResults = {
          modifiedPorts: setModifiedPorts({ buildTemplate: outputTemplateJson, buildOptions, serviceName }),
          modifiedLogging: setLoggingState({ buildTemplate: outputTemplateJson, buildOptions, serviceName }),
          modifiedNetworkMode: setNetworkMode({ buildTemplate: outputTemplateJson, buildOptions, serviceName }),
          modifiedNetworks: setNetworks({ buildTemplate: outputTemplateJson, buildOptions, serviceName }),
          modifiedEnvironment: setEnvironmentVariables({ buildTemplate: outputTemplateJson, buildOptions, serviceName }),
          modifiedDevices: setDevices({ buildTemplate: outputTemplateJson, buildOptions, serviceName })
        };

        // Set env var port
        const serviceEnvironmentList = outputTemplateJson?.services?.[serviceName]?.environment ?? [];
        if (Array.isArray(serviceEnvironmentList) && serviceEnvironmentList.length > 0) {
          const { getConfigOptions } = require('./config')({});
          const envPorts = {
            wireguardInternalPort: getSetPortsByConfigName({ buildTemplate: outputTemplateJson, buildOptions, serviceName, configOptions: getConfigOptions(), portName: 'vpn' })?.internalPort,
            wireguardExternalPort: getSetPortsByConfigName({ buildTemplate: outputTemplateJson, buildOptions, serviceName, configOptions: getConfigOptions(), portName: 'vpn' })?.externalPort
          };

          serviceEnvironmentList.forEach((envKVP, index) => {
            outputTemplateJson.services[serviceName].environment[index] = byName(
              outputTemplateJson.services[serviceName].environment[index],
              {
                ...envPorts
              }
            );
          });
        }

        console.info(`ServiceBuilder:compile() - '${serviceName}' Results:`, compileResults);

        console.info(`ServiceBuilder:compile() - '${serviceName}' completed`);
        return resolve({ type: 'service' });
      } catch (err) {
        console.error(err);
        console.trace();
        console.debug("\nParams:");
        console.debug({ outputTemplateJson });
        console.debug({ buildOptions });
        return reject({
          component: `ServiceBuilder::compile() - '${serviceName}'`,
          message: 'Unhandled error occured',
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
      }
    });
  };

  retr.issues = ({
    outputTemplateJson,
    buildOptions,
    tmpPath
  }) => {
    return new Promise((resolve, reject) => {
      try {
        console.info(`ServiceBuilder:issues() - '${serviceName}' started`);
        let issues = [];

        const portConflicts = checkPortConflicts({ buildTemplate: outputTemplateJson, buildOptions, serviceName });
        issues = [...issues, ...portConflicts];

        const serviceDependencies = checkDependencyServices({ buildTemplate: outputTemplateJson, buildOptions, serviceName });
        issues = [...issues, ...serviceDependencies];

        const networkConflicts = checkNetworkConflicts({ buildTemplate: outputTemplateJson, buildOptions, serviceName });
        if (networkConflicts) {
          issues.push(networkConflicts);
        }

        console.info(`ServiceBuilder:issues() - '${serviceName}' Issues found: ${issues.length}`);
        console.info(`ServiceBuilder:issues() - '${serviceName}' completed`);
        return resolve(issues);
      } catch (err) {
        console.error(err);
        console.trace();
        console.debug("\nParams:");
        console.debug({ outputTemplateJson });
        console.debug({ buildOptions });
        console.debug({ tmpPath });
        return reject({
          component: `ServiceBuilder::issues() - '${serviceName}'`,
          message: 'Unhandled error occured',
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
      }
    });
  };

  retr.build = ({
    outputTemplateJson,
    buildOptions,
    tmpPath,
    zipList,
    prebuildScripts,
    postbuildScripts
  }) => {
    return new Promise((resolve, reject) => {
      try {
        console.info(`ServiceBuilder:build() - '${serviceName}' started`);

        const wireguardConfFilePath = path.join(__dirname, settings.paths.serviceFiles, 'wg0.conf');
        zipList.push({
          fullPath: wireguardConfFilePath,
          zipName: '/services/wireguard/wg0.conf'
        });
        console.debug(`ServiceBuilder:build() - '${serviceName}' Added '${wireguardConfFilePath}' to zip`);

        postbuildScripts.push({
          serviceName,
          comment: 'Ensure required service files exist for launch',
          multilineComment: null,
          code: checkServiceFilesCopied()
        });

        prebuildScripts.push({
          serviceName,
          comment: 'Create required service directory exists for first launch',
          multilineComment: null,
          code: createVolumesDirectory()
        });

        postbuildScripts.push({
          serviceName,
          comment: 'Ensure required service directory exists for launch',
          multilineComment: null,
          code: checkVolumesDirectory()
        });

        console.info(`ServiceBuilder:build() - '${serviceName}' completed`);
        return resolve({ type: 'service' });
      } catch (err) {
        console.error(err);
        console.trace();
        console.debug("\nParams:");
        console.debug({ outputTemplateJson });
        console.debug({ buildOptions });
        console.debug({ tmpPath });
        return reject({
          component: `ServiceBuilder::build() - '${serviceName}'`,
          message: 'Unhandled error occured',
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
      }
    });
  };

  return retr;
}

module.exports = ServiceBuilder;
