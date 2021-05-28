const ServiceBuilder = ({
  settings,
  version,
  logger
}) => {
  const path = require('path');
  const retr = {};
  const serviceName = 'mosquitto';

  const {
    setImageTag,
    setModifiedPorts,
    setLoggingState,
    setNetworkMode,
    setNetworks,
    setVolumes,
    setEnvironmentVariables,
    setDevices
  } = require('../../../src/utils/commonCompileLogic');

  const {
    checkPortConflicts,
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
if [[ ! -f ./services/mosquitto/config/mosquitto.conf ]]; then
  echo "Mosquitto config file is missing!"
  sleep 2
fi
`;
  };

  const createVolumesDirectory = () => {
    return `
mkdir -p ./volumes/mosquitto/data
mkdir -p ./volumes/mosquitto/config
mkdir -p ./volumes/mosquitto/pwfile
mkdir -p ./volumes/mosquitto/log
`;
  };

  const checkVolumesDirectory = () => {
    return `
HAS_ERROR="false"
if [[ ! -d ./volumes/mosquitto/data ]]; then
  echo "Mosquitto data directory is missing!"
  HAS_ERROR="true"
fi

if [[ ! -d ./volumes/mosquitto/config ]]; then
  echo "Mosquitto config directory is missing!"
  HAS_ERROR="true"
fi

if [[ ! -d ./volumes/mosquitto/log ]]; then
  echo "Mosquitto log directory is missing!"
  HAS_ERROR="true"
fi

if [[ ! -d ./volumes/mosquitto/pwfile ]]; then
  echo "Mosquitto pwfile directory is missing!"
  HAS_ERROR="true"
fi

if [[ "$HAS_ERROR" == "true" ]]; then
  echo "Errors were detected when setting up Mosquitto"
  sleep 1
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
          modifiedImage: setImageTag({ buildTemplate: outputTemplateJson, buildOptions, serviceName }),
          modifiedPorts: setModifiedPorts({ buildTemplate: outputTemplateJson, buildOptions, serviceName }),
          modifiedLogging: setLoggingState({ buildTemplate: outputTemplateJson, buildOptions, serviceName }),
          modifiedNetworkMode: setNetworkMode({ buildTemplate: outputTemplateJson, buildOptions, serviceName }),
          modifiedNetworks: setNetworks({ buildTemplate: outputTemplateJson, buildOptions, serviceName }),
          modifiedVolumes: setVolumes({ buildTemplate: outputTemplateJson, buildOptions, serviceName }),
          modifiedEnvironment: setEnvironmentVariables({ buildTemplate: outputTemplateJson, buildOptions, serviceName }),
          modifiedDevices: setDevices({ buildTemplate: outputTemplateJson, buildOptions, serviceName })
        };
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
        const mosquittoConfFilePath = path.join(__dirname, settings.paths.serviceFiles, 'config', 'mosquitto.conf');
        zipList.push({
          fullPath: mosquittoConfFilePath,
          zipName: '/services/mosquitto/config/mosquitto.conf'
        });
        console.debug(`ServiceBuilder:build() - '${serviceName}' Added '${mosquittoConfFilePath}' to zip`);

        const mosquittoAclFilePath = path.join(__dirname, settings.paths.serviceFiles, 'config', 'filter.acl');
        zipList.push({
          fullPath: mosquittoAclFilePath,
          zipName: '/services/mosquitto/config/filter.acl'
        });
        console.debug(`ServiceBuilder:build() - '${serviceName}' Added '${mosquittoAclFilePath}' to zip`);

        const mosquittoPwFilePath = path.join(__dirname, settings.paths.serviceFiles, 'pwfile', 'pwfile');
        zipList.push({
          fullPath: mosquittoPwFilePath,
          zipName: '/services/mosquitto/pwfile/pwfile'
        });
        console.debug(`ServiceBuilder:build() - '${serviceName}' Added '${mosquittoPwFilePath}' to zip`);

        const mosquittoDockerFilePath = path.join(__dirname, settings.paths.buildFiles, 'Dockerfile');
        zipList.push({
          fullPath: mosquittoDockerFilePath,
          zipName: '/services/mosquitto/Dockerfile'
        });
        console.debug(`ServiceBuilder:build() - '${serviceName}' Added '${mosquittoDockerFilePath}' to zip`);

        const mosquittoDockerEntryPointFilePath = path.join(__dirname, settings.paths.buildFiles, 'docker-entrypoint.sh');
        zipList.push({
          fullPath: mosquittoDockerEntryPointFilePath,
          zipName: '/services/mosquitto/docker-entrypoint.sh'
        });
        console.debug(`ServiceBuilder:build() - '${serviceName}' Added '${mosquittoDockerEntryPointFilePath}' to zip`);

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
