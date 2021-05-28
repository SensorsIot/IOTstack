const fs = require('fs');
const path = require('path');
const { byName } = require('../../../src/utils/interpolate');

const ServiceBuilder = ({
  settings,
  version,
  logger
}) => {
  const retr = {};
  const serviceName = 'nodered';

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

  const createVolumesDirectory = () => {
    return `
mkdir -p ./volumes/nodered/data
`;
  };

  const checkVolumesDirectory = () => {
    return `
if [[ ! -d ./volumes/nodered/data ]]; then
  echo "Nodered data directory is missing!"
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

        let addonsSelected = false;
        const addonsList = buildOptions?.configurations?.services?.nodered?.addonsList ?? [];
        if (addonsList.length > 0) {
          addonsSelected = true;
        }
        console.info(`ServiceBuilder:issues() - '${serviceName}' Addons selected: ${addonsList.length}`);
        console.info(`ServiceBuilder:issues() - '${serviceName}' completed`);
        if (!addonsSelected) {
          issues.push({
            type: 'service',
            name: serviceName,
            issueType: 'no addons',
            message: 'No pallette addons selected for NodeRed. Select addons in options to remove this warning. Default modules will be installed.'
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
    fileTimePrefix,
    buildOptions,
    tmpPath,
    zipList,
    prebuildScripts,
    postbuildScripts
  }) => {
    return new Promise((resolve, reject) => {
      try {
        console.info(`ServiceBuilder:build() - '${serviceName}' started`);
        const addonsList = buildOptions?.configurations?.services?.nodered?.addonsList ?? false;
        const noderedDockerfileTemplate = path.join(__dirname, settings.paths.buildFiles, 'Dockerfile.template');
        const noderedDockerfileCommandTemplate = require(path.join(__dirname, settings.paths.buildFiles, 'addons.json'));
        const tempDockerfileName = `${fileTimePrefix}_Dockerfile.template`;

        const templateData = fs.readFileSync(noderedDockerfileTemplate, { encoding: 'utf8', flag: 'r' });
        let addonDockerCommandOutput = noderedDockerfileCommandTemplate.data.dockerFileInstallCommand;
        let addonDockerUnsafeCommandOutput = noderedDockerfileCommandTemplate.data.dockerFileInstallUnsafeCommand;

        let unsafeAddonsCount = 0;
        let npmAddonsCount = 0;

        if (Array.isArray(addonsList)) {
          if (addonsList.length > 0) {
            addonsList.forEach((addon) => {
              if (noderedDockerfileCommandTemplate.data.unsafeAddons.includes(addon)) {
                addonDockerUnsafeCommandOutput += `${addon} `;
                unsafeAddonsCount++;
              } else {
                addonDockerCommandOutput += `${addon} `;
                npmAddonsCount++;
              }
            });
          }

        } else {
          // Use default addons
          const defaultAddons = require("./buildFiles/addons.json");
          (defaultAddons?.data?.addons?.defaultOn ?? []).forEach((addon) => {
            if (noderedDockerfileCommandTemplate.data.unsafeAddons.includes(addon)) {
              addonDockerUnsafeCommandOutput += `${addon} `;
              unsafeAddonsCount++;
            } else {
              addonDockerCommandOutput += `${addon} `;
              npmAddonsCount++;
            }
          });
        }
  
        if (unsafeAddonsCount < 1) {
          addonDockerUnsafeCommandOutput = '';
        }

        if (npmAddonsCount < 1) {
          addonDockerCommandOutput = '';
        }

        const outputDockerFile = byName(templateData, {
          'npmInstallModulesList': addonDockerCommandOutput,
          'npmInstallUnsafeModulesList': addonDockerUnsafeCommandOutput
        });

        const tempBuildFile = path.join(tmpPath, tempDockerfileName);

        fs.writeFileSync(tempBuildFile, outputDockerFile);

        zipList.push({
          fullPath: tempBuildFile,
          zipName: '/services/nodered/Dockerfile'
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

        console.info(`ServiceBuilder:build() - '${serviceName}' Addons: ${Array.isArray(addonsList) ? 'custom list' : 'default list'}`);
        console.info(`ServiceBuilder:build() - '${serviceName}' Safe Addons: ${npmAddonsCount}, Unsafe addons: ${unsafeAddonsCount}`);
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
