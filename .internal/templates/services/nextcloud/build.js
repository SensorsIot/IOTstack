const ServiceBuilder = ({
  settings,
  version,
  logger
}) => {
  const retr = {};
  const serviceName = 'nextcloud';

  const { generatePassword } = require('../../../src/utils/stringGenerate');
  const { byName } = require('../../../src/utils/interpolate');

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
    logger.debug(`ServiceBuilder:init() - '${serviceName}', 'nextcloud_db'`);
  };

  const createVolumesDirectory = () => {
    return `
mkdir -p ./volumes/nextcloud/html
mkdir -p ./volumes/nextcloud/db
`;
  };

  const checkVolumesDirectory = () => {
    return `
HAS_ERROR="false"
if [[ ! -d ./volumes/nextcloud/html ]]; then
  echo "Nextcloud html directory is missing!"
  HAS_ERROR="true"
fi

if [[ ! -d ./volumes/nextcloud/db ]]; then
  echo "Nextcloud db directory is missing!"
  HAS_ERROR="true"
fi

if [[ "$HAS_ERROR" == "true" ]]; then
    sleep 1
fi
`;
  };

  retr.compile = ({
    outputTemplateJson,
    buildOptions
  }) => {
    return new Promise((resolve, reject) => {
      try {
        console.info(`ServiceBuilder:compile() - '${serviceName}', 'nextcloud_db' started`);

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

        // Generate and sync relevant env vars
        ncMariaDbRootPw = generatePassword();
        ncMariaDbPw = generatePassword();
        const syncDbSettings = {
          MYSQL_PASSWORD: ncMariaDbPw,
          MYSQL_ROOT_PASSWORD: ncMariaDbRootPw
        };

        const serviceEnvironmentList = outputTemplateJson?.services?.[serviceName]?.environment ?? [];
        const dbEnvironmentList = outputTemplateJson?.services?.nextcloud_db?.environment ?? [];

        if (Array.isArray(serviceEnvironmentList) && serviceEnvironmentList.length > 0) {
          serviceEnvironmentList.forEach((envKVP, index) => {
            const envKey = envKVP.split('=')[0];
            const envValue = envKVP.split('=')[1];

            if (envKey === 'MYSQL_PASSWORD') {
              outputTemplateJson.services[serviceName].environment[index] = byName(
                outputTemplateJson.services[serviceName].environment[index],
                {
                  nextcloudRandomPassword: syncDbSettings.MYSQL_PASSWORD
                }
              );
              syncDbSettings.MYSQL_PASSWORD = outputTemplateJson.services[serviceName].environment[index];
            }

            if (envKey === 'MYSQL_ROOT_PASSWORD') {
              outputTemplateJson.services[serviceName].environment[index] = byName(
                outputTemplateJson.services[serviceName].environment[index],
                {
                  nextcloudRootRandomPassword: syncDbSettings.MYSQL_ROOT_PASSWORD
                }
              );
              syncDbSettings.MYSQL_ROOT_PASSWORD = outputTemplateJson.services[serviceName].environment[index];
            }

            if (envKey === 'MYSQL_USER') {
              syncDbSettings.MYSQL_USER = `${envKey}=${envValue}`;
            }

            if (envKey === 'MYSQL_DATABASE') {
              syncDbSettings.MYSQL_DATABASE = `${envKey}=${envValue}`;
            }
          });

          outputTemplateJson.services[serviceName].environment = outputTemplateJson.services[serviceName].environment.filter((envKVP) => { // Remove unneeded env var
            if (envKVP.split('=')[0] === 'MYSQL_ROOT_PASSWORD') {
              return false;
            }

            return true;
          });
        }

        if (Array.isArray(dbEnvironmentList) && dbEnvironmentList.length > 0) {
          dbEnvironmentList.forEach((envKVP, index) => {
            const envKey = envKVP.split('=')[0];

            if (envKey === 'MYSQL_PASSWORD') {
              outputTemplateJson.services.nextcloud_db.environment[index] = syncDbSettings.MYSQL_PASSWORD;
            }

            if (envKey === 'MYSQL_ROOT_PASSWORD') {
              outputTemplateJson.services.nextcloud_db.environment[index] = syncDbSettings.MYSQL_ROOT_PASSWORD;
            }

            if (envKey === 'MYSQL_USER') {
              outputTemplateJson.services.nextcloud_db.environment[index] = syncDbSettings.MYSQL_USER;
            }

            if (envKey === 'MYSQL_DATABASE') {
              outputTemplateJson.services.nextcloud_db.environment[index] = syncDbSettings.MYSQL_DATABASE;
            }
          });
        }

        // Move db volume to db service.
        const serviceVolumeList = outputTemplateJson?.services?.[serviceName]?.volumes ?? [];
        let dbVol = '';
        if (Array.isArray(serviceVolumeList) && serviceVolumeList.length > 0) {
          serviceVolumeList.forEach((vol, index) => {
            const internalVol = vol.split(':')[1];

            if (internalVol === '/var/lib/mysql') {
              dbVol = vol;
            }
          });

          outputTemplateJson.services[serviceName].volumes = outputTemplateJson.services[serviceName].volumes.filter((volume) => { // Remove unneeded volume
            if (volume.split(':')[1] === '/var/lib/mysql') {
              return false;
            }

            return true;
          });
        }

        let foundVolEntry = false;
        if (Array.isArray(outputTemplateJson?.services?.nextcloud_db?.volumes ?? false) && outputTemplateJson.services.nextcloud_db.volumes.length > 0 && dbVol) {
          outputTemplateJson.services.nextcloud_db.volumes.forEach((vol, index) => {
            const internalVol = vol.split(':')[1];

            if (internalVol === '/var/lib/mysql') {
              foundVolEntry = true;
              outputTemplateJson.services.nextcloud_db.volumes[index] = dbVol;
            }
          });
        }

        if (!foundVolEntry && dbVol && (outputTemplateJson?.services?.nextcloud_db?.volumes ?? false)) {
          outputTemplateJson.services.nextcloud_db.volumes.push(dbVol);
        }

        console.info(`ServiceBuilder:compile() - '${serviceName}', 'nextcloud_db' Results:`, compileResults);

        console.info(`ServiceBuilder:compile() - '${serviceName}', 'nextcloud_db' completed`);
        return resolve({ type: 'service' });
      } catch (err) {
        console.error(err);
        console.trace();
        console.debug("\nParams:");
        console.debug({ outputTemplateJson });
        console.debug({ buildOptions });
        return reject({
          component: `ServiceBuilder::compile() - '${serviceName}', 'nextcloud_db'`,
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
        console.info(`ServiceBuilder:issues() - '${serviceName}', 'nextcloud_db' started`);
        let issues = [];

        const portConflicts = checkPortConflicts({ buildTemplate: outputTemplateJson, buildOptions, serviceName });
        issues = [...issues, ...portConflicts];

        const serviceDependencies = checkDependencyServices({ buildTemplate: outputTemplateJson, buildOptions, serviceName, ignoreDependencies: ['nextcloud_db'] });
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
                    message: `Database passwords are not set in environment variables.`
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
              message: `No database environment variables found.`
            });
          }
        } else {
          issues.push({
            type: 'service',
            name: serviceName,
            issueType: 'environment',
            message: `No environment variables found. Service may not start unless they are set.`
          });
        }

        const volumeList = outputTemplateJson?.services?.[serviceName]?.volumes ?? [];
        if (Array.isArray(environmentList) && environmentList.length > 0) {
          const databaseVolumeSet = false;
          volumeList.forEach((vol) => {
            const internalVol = vol.split(':')[1];
            const externalVol = vol.split(':')[0];

            if (internalVol === '/var/lib/mysql' && externalVol === 'Unset') {
              issues.push({
                type: 'service',
                name: serviceName,
                issueType: 'volumes',
                message: `Volumes are not set`
              });
            }
          });

        }

        console.info(`ServiceBuilder:issues() - '${serviceName}', 'nextcloud_db' Issues found: ${issues.length}`);
        console.info(`ServiceBuilder:issues() - '${serviceName}', 'nextcloud_db' completed`);
        return resolve(issues);
      } catch (err) {
        console.error(err);
        console.trace();
        console.debug("\nParams:");
        console.debug({ outputTemplateJson });
        console.debug({ buildOptions });
        console.debug({ tmpPath });
        return reject({
          component: `ServiceBuilder::issues() - '${serviceName}', 'nextcloud_db'`,
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
        console.info(`ServiceBuilder:build() - '${serviceName}', 'nextcloud_db' started`);

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

        console.info(`ServiceBuilder:build() - '${serviceName}', 'nextcloud_db' completed`);
        return resolve({ type: 'service' });
      } catch (err) {
        console.error(err);
        console.trace();
        console.debug("\nParams:");
        console.debug({ outputTemplateJson });
        console.debug({ buildOptions });
        console.debug({ tmpPath });
        return reject({
          component: `ServiceBuilder::build() - '${serviceName}', 'nextcloud_db'`,
          message: 'Unhandled error occured',
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
      }
    });
  };

  return retr;
}

module.exports = ServiceBuilder;
