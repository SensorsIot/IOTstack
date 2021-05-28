const ServiceBuilder = ({
  settings,
  version,
  logger
}) => {
  const retr = {};
  const serviceName = 'mariadb';

  const {
    setModifiedPorts,
    setLoggingState,
    setNetworkMode,
    setNetworks,
    setDevices,
    setEnvironmentVariables
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
mkdir -p ./volumes/mariadb/config
`;
  };

  const checkVolumesDirectory = () => {
    return `
if [[ ! -d ./volumes/mariadb/config ]]; then
  echo "MariaDB config directory is missing!"
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

        const environmentList = outputTemplateJson?.services?.[serviceName]?.environment ?? [];
        if (Array.isArray(environmentList) && environmentList.length > 0) {
          let pwKeysFound = false;
          environmentList.forEach((envKVP) => {
            const envKey = envKVP.split('=')[0];
            const envValue = envKVP.split('=')[1];
            if (envKey && envValue) {
              if (envKey === 'MYSQL_ROOT_PASSWORD' || envKey === 'MYSQL_PASSWORD') {
                pwKeysFound = true;
                if (envValue === 'Unset' || envValue === 'Unset') {
                  issues.push({
                    type: 'service',
                    name: serviceName,
                    issueType: 'environment',
                    message: `Ensure database passwords are set in environment variables.`
                  });
                }
              }
            }
          });

          if (!pwKeysFound) {
            issues.push({
              type: 'service',
              name: serviceName,
              issueType: 'environment',
              message: `No environment variables found. Database may not start unless they are set.`
            });
          }
        } else {
          issues.push({
            type: 'service',
            name: serviceName,
            issueType: 'environment',
            message: `No environment variables found. Database may not start unless they are set.`
          });
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
