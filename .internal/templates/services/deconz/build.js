const ServiceBuilder = ({
  settings,
  version,
  logger
}) => {
  const retr = {};
  const serviceName = 'deconz';

  const { byName } = require('../../../src/utils/interpolate');

  const {
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

  const createVolumesDirectory = () => {
    return `
mkdir -p ./volumes/deconz
`;
  };

  const checkVolumesDirectory = () => {
    return `
if [[ ! -d ./volumes/deconz ]]; then
  echo "Deconz directory is missing!"
  sleep 2
fi
`;
  };

  const checkDeconzDevice = (devicePath) => {
    return `
if [[ ! -f ${devicePath} ]]; then
  echo "Ensure that Deconz has the correct device set in environment and devices list: ${devicePath}"
  sleep 2
fi
`;
  };

  retr.compile = ({
    outputTemplateJson,
    buildOptions
  }) => {
    return new Promise((resolve, reject) => {
      try {
        console.info(`ServiceBuilder:compile() - '${serviceName}' started`);

        const compileResults = {
          modifiedPorts: setModifiedPorts({ buildTemplate: outputTemplateJson, buildOptions, serviceName }),
          modifiedLogging: setLoggingState({ buildTemplate: outputTemplateJson, buildOptions, serviceName }),
          modifiedNetworkMode: setNetworkMode({ buildTemplate: outputTemplateJson, buildOptions, serviceName }),
          modifiedNetworks: setNetworks({ buildTemplate: outputTemplateJson, buildOptions, serviceName }),
          modifiedVolumes: setVolumes({ buildTemplate: outputTemplateJson, buildOptions, serviceName }),
          modifiedEnvironment: setEnvironmentVariables({ buildTemplate: outputTemplateJson, buildOptions, serviceName }),
          modifiedDevices: setDevices({ buildTemplate: outputTemplateJson, buildOptions, serviceName })
        };

        const selectedDevice = buildOptions?.configurations?.services?.[serviceName]?.selectedDevice ?? '';

        // Set deconz's selected device device
        const deconzDevicesList = outputTemplateJson?.services?.[serviceName]?.devices ?? [];
        if (Array.isArray(deconzDevicesList) && deconzDevicesList.length > 0) {
          deconzDevicesList.forEach((device, index) => {
            outputTemplateJson.services[serviceName].devices[index] = byName(
              outputTemplateJson.services[serviceName].devices[index],
              {
                deconzSelectedDevice: selectedDevice
              }
            );
          });
        } else {
          if ((outputTemplateJson?.services?.[serviceName] ?? false) && selectedDevice) {
            outputTemplateJson.services[serviceName].devices = [selectedDevice];
          }
        }

        // Set deconz's selected device env var
        const serviceEnvironmentList = outputTemplateJson?.services?.[serviceName]?.environment ?? [];
        if (Array.isArray(serviceEnvironmentList) && serviceEnvironmentList.length > 0) {
          serviceEnvironmentList.forEach((envKVP, index) => {
            outputTemplateJson.services[serviceName].environment[index] = byName(
              outputTemplateJson.services[serviceName].environment[index],
              {
                deconzSelectedDevice: selectedDevice
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

        if (buildOptions?.configurations?.services?.[serviceName]?.selectedDevice ?? false) {
          postbuildScripts.push({
            serviceName,
            comment: 'Check deconz set env device',
            multilineComment: null,
            code: checkDeconzDevice(buildOptions?.configurations?.services?.[serviceName]?.selectedDevice ?? '/dev/null')
          });
        }

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
