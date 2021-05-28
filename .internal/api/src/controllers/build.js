const BuildController = ({ server, settings, version, logger }) => {
  const BuildsService = require('../services/builds');
  const ZipService = require('../services/zip');
  const TemplatesController = require('./templates');
  const { getDirectoryList, getFileList, emptyDirectory } = require('../utils/fsUtils');
  const { formatDate } = require('../utils/date');
  const { getUniqueNetworkListFromServices } = require('../utils/networkUtils');
  const buildInstallerGenerator = require('../../templates/scripts/build_installer');
  const retr = {};

  const buildsService = BuildsService({ server, settings, version, logger });
  const zipService = ZipService({ server, settings, version, logger });
  const templatesController = TemplatesController({ server, settings, version, logger });
  const path = require('path');
  const fs = require('fs');

  retr.init = () => {
    templatesController.init();
    buildsService.init();
    zipService.init();
    logger.debug('BuildController:init()');
  };

  retr.buildStack = async ({ host, buildOptions, composeFileVersion }) => {
    return new Promise(async (resolve, reject) => {
      try {
        outputStack = {
          version: composeFileVersion || '3.6',
          services: {},
          networks: {}
        };

        const currentDate = formatDate();
        const toZip = [];
        const prebuildScripts = [];
        const postbuildScripts = [];

        const failedStack = {
          services: [],
          networks: []
        };

        // Get service templates for processing and output
        const serviceTemplatePromises = [];

        buildOptions.selectedServices.forEach((selectedService) => {
          serviceTemplatePromises.push(templatesController.getServiceTemplateAsJson(selectedService));
        });

        await Promise.allSettled(serviceTemplatePromises).then((serviceTemplateResults) => {
          serviceTemplateResults.forEach((servicePromiseResult) => {
            if (servicePromiseResult.status === 'fulfilled' && servicePromiseResult.value) {
              Object.keys(servicePromiseResult.value).forEach((serviceName) => {
                outputStack.services[serviceName] = servicePromiseResult.value[serviceName];
              });
            } else {
              failedStack.services.push(servicePromiseResult);
            }
          });
          return outputStack;
        });

        const podNetworks = getUniqueNetworkListFromServices({ services: outputStack.services, logger });

        // Get network templates for processing and output
        const networkTemplatePromises = [];

        podNetworks.forEach((networkName) => {
          networkTemplatePromises.push(templatesController.getNetworkTemplateAsJson(networkName));
        });

        await Promise.allSettled(networkTemplatePromises).then((networkTemplateResults) => {
          networkTemplateResults.forEach((networkPromiseResult) => {
            if (networkPromiseResult.status === 'fulfilled' && networkPromiseResult.value) {
              const networkName = Object.keys(networkPromiseResult.value)[0];
              outputStack.networks[networkName] = networkPromiseResult.value[networkName];
            } else {
              failedStack.networks.push(networkPromiseResult);
            }
          });
          return outputStack;
        });

        if (failedStack.services.length > 0 || failedStack.networks.length > 0) {
          logger.warn('Failed to compile some templates: ', failedStack);
        }

        // All templates gathered and ready for processing by each service.
        const templatesBuildLogic = [];
        const {
          localBuildsDirectory,
          buildInstallerFilePostfix,
          localTemplatesPath,
          localNetworksRelativePath,
          localServicesRelativePath,
          buildLogicFile,
          buildDockerFilePostfix,
          buildOptionsFilePostfix,
          localTmpPath
        } = settings.paths;

        emptyDirectory(localTmpPath, ['.gitignore']);

        const servicesBuildPath = path.join(localTemplatesPath, localServicesRelativePath);
        const networksBuildPath = path.join(localTemplatesPath, localNetworksRelativePath);

        // Instantiate each service's build logic
        let failedServices = [];
        Object.keys(outputStack.services).forEach((serviceName) => {
          const serviceBuildScript = path.join(servicesBuildPath, serviceName, buildLogicFile);
          if (!fs.existsSync(path.join(servicesBuildPath, serviceName))) {
            return; // Skip. This means the service's directory doesn't exist and it is likely an add-on (NextCloud DB for example)
          }

          if (fs.existsSync(serviceBuildScript)) {
            templatesBuildLogic.push(require(serviceBuildScript)({ settings, version, logger }));
          } else {
            logger.log(`BuildController::buildStack: No service build file for '${serviceName}'. Looking in: '${serviceBuildScript}'`);
            failedServices.push({ serviceName: `No build file. Check logs for more details. Looking in: '${serviceBuildScript}'` });
          }
        });

        // Instantiate each network's build logic
        Object.keys(outputStack.networks).forEach((networkName) => {
          const networkBuildScript = path.join(networksBuildPath, networkName, buildLogicFile);
          if (fs.existsSync(networkBuildScript)) {
            templatesBuildLogic.push(require(networkBuildScript)({ settings, version, logger }));
          } else {
            logger.log(`BuildController::buildStack: No network build file for '${networkName}'. Looking in: '${networkBuildScript}'`);
          }
        });

        if (failedServices.length > 0) {
          return reject({
            component: 'BuildController::buildStack',
            message: `One or more services failed to build: '${JSON.stringify(failedServices)}'`
          });
        }

        const issueList = {
          services: [],
          networks: [],
          other: []
        };

        // Compile service options to JSON output
        logger.debug('BuildController::buildStack: Compile started');
        for (let i = 0; i < templatesBuildLogic.length; i++) {
          await templatesBuildLogic[i].compile({
            outputTemplateJson: outputStack,
            buildOptions,
          });
        }

        // Use default values for services if not specified
        for (let i = 0; i < templatesBuildLogic.length; i++) {
          if (typeof(templatesBuildLogic[i].assume) === 'function') {
            await templatesBuildLogic[i].assume({
              outputTemplateJson: outputStack,
              buildOptions,
            });
          }
        }
        logger.debug('BuildController::buildStack: Compile completed');

        logger.debug('BuildController::buildStack: Build started');
        await templatesBuildLogic.reduce((prom, buildLogic) => {
          return prom.then(async () => {
            if (typeof buildLogic.build === 'function') {
              await buildLogic.build({
                outputTemplateJson: outputStack,
                buildOptions,
                tmpPath: localTmpPath,
                fileTimePrefix: currentDate,
                zipList: toZip,
                prebuildScripts,
                postbuildScripts
              });
              // .then((res) => {
              //   logger.log('Result: ', res);
              // });
            }

            if (typeof buildLogic.issues === 'function') {
              return buildLogic.issues({
                outputTemplateJson: outputStack,
                buildOptions,
                tmpPath: localTmpPath
              }).then((issueResults) => {
                if (Array.isArray(issueResults) && issueResults.length > 0) {
                  issueResults.forEach((issue) => {
                    if (issue.type === 'service') {
                      issueList.services.push(issue);
                    } else if (issue.type === 'network') {
                      issueList.networks.push(issue);
                    } else {
                      issueList.other.push(issue);
                    }
                  });
                }
              });
            }

            return Promise.resolve({});
          });
        }, Promise.resolve()).then(() => {
          logger.debug('BuildController::buildStack: Build Completed');
        }).catch((err) => {
          logger.error('BuildController::buildStack: Build Error: ', err);
          return reject({
            component: 'BuildController::buildStack',
            message: 'Unhandled error occured',
            error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
          });
        });

        if (Object.keys(outputStack?.networks ?? {}).length === 0) {
          delete outputStack.networks;
        }

        const { yamlFilename, yamlOutputFilePath } = await buildsService.saveBuildYaml({ buildJson: outputStack, fileTimePrefix: currentDate });
        const { jsonFilename, jsonOutputFilePath } = await buildsService.saveBuildOptions({ buildOptionsJson: buildOptions, fileTimePrefix: currentDate });
        const dockerComposeBaseFilename = buildDockerFilePostfix.split('_')[1];
        const buildInstallerFileBaseFilename = buildInstallerFilePostfix.split('_')[1];
        const buildOptionsBaseFilename = buildOptionsFilePostfix.split('_')[1];

        buildInstallerFilePostfix
        const buildInstallerContents = await buildInstallerGenerator({
          options: {
            build: currentDate,
            prebuildScripts,
            postbuildScripts,
            selectedServices: buildOptions.selectedServices
          },
          logger,
          version
        });

        const installerScriptFilename = `${currentDate}${buildInstallerFilePostfix}`;
        const installerOutputFilePath = path.join(localBuildsDirectory, installerScriptFilename);

        fs.writeFileSync(installerOutputFilePath, buildInstallerContents.data);

        toZip.push({
          fullPath: installerOutputFilePath,
          zipName: buildInstallerFileBaseFilename
        });

        toZip.push({
          fullPath: yamlOutputFilePath,
          zipName: dockerComposeBaseFilename
        });

        toZip.push({
          fullPath: jsonOutputFilePath,
          zipName: buildOptionsBaseFilename
        });

        const zipDirectories = [];
        toZip.forEach((zipEntries) => {
          if (Array.isArray(zipEntries.directories) && zipEntries.directories.length > 0) {
            zipEntries.directories.forEach((directory) => {
              zipDirectories.push(directory);
            });
          }
        });

        const zipResults = await zipService.zipFiles({ fileList: toZip, fileTimePrefix: currentDate, archiveDirectoryList: zipDirectories });

        return resolve({
          issueList,
          build: currentDate,
          host,
          files: {
            yamlFilename,
            jsonFilename,
            zipFilename: zipResults.zipFilename
          }
        });

      } catch (err) {
        logger.log(err);
        logger.trace();
        return reject({
          component: 'BuildController::buildStack',
          message: 'Unhandled error occured',
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
      }
    });
  };

  retr.checkIssues = ({ buildOptions }) => {
    return new Promise(async (resolve, reject) => {
      try {
        outputStack = {
          services: {},
          networks: {}
        };

        const failedStack = {
          services: [],
          networks: []
        };

        // Get service templates for processing and output
        const serviceTemplatePromises = [];

        buildOptions.selectedServices.forEach((selectedService) => {
          serviceTemplatePromises.push(templatesController.getServiceTemplateAsJson(selectedService));
        });

        await Promise.allSettled(serviceTemplatePromises).then((serviceTemplateResults) => {
          serviceTemplateResults.forEach((servicePromiseResult) => {
            if (servicePromiseResult.status === 'fulfilled' && servicePromiseResult.value) {
              const serviceName = Object.keys(servicePromiseResult.value)[0];
              outputStack.services[serviceName] = servicePromiseResult.value[serviceName];
            } else {
              failedStack.services.push(servicePromiseResult);
            }
          });
          return outputStack;
        });

        const podNetworks = getUniqueNetworkListFromServices({ services: outputStack.services, logger });

        // Get network templates for processing and output
        const networkTemplatePromises = [];

        podNetworks.forEach((networkName) => {
          networkTemplatePromises.push(templatesController.getNetworkTemplateAsJson(networkName));
        });

        await Promise.allSettled(networkTemplatePromises).then((networkTemplateResults) => {
          networkTemplateResults.forEach((networkPromiseResult) => {
            if (networkPromiseResult.status === 'fulfilled' && networkPromiseResult.value) {
              const networkName = Object.keys(networkPromiseResult.value)[0];
              outputStack.networks[networkName] = networkPromiseResult.value[networkName];
            } else {
              failedStack.networks.push(networkPromiseResult);
            }
          });
          return outputStack;
        });

        if (failedStack.services.length > 0 || failedStack.networks.length > 0) {
          logger.warn('Failed to compile some templates: ', failedStack);
        }

        // All templates gathered and ready for processing by each service.
        const templatesBuildLogic = [];
        const {
          localTemplatesPath,
          localNetworksRelativePath,
          localServicesRelativePath,
          buildLogicFile
        } = settings.paths;
        const servicesBuildPath = path.join(localTemplatesPath, localServicesRelativePath);
        const networksBuildPath = path.join(localTemplatesPath, localNetworksRelativePath);

        // Instantiate each service's build logic
        let failedServices = [];
        Object.keys(outputStack.services).forEach((serviceName) => {
          const serviceBuildScript = path.join(servicesBuildPath, serviceName, buildLogicFile);
          if (!fs.existsSync(path.join(servicesBuildPath, serviceName))) {
            return; // Skip. This means the service's directory doesn't exist and it is likely an add-on (NextCloud DB for example)
          }

          if (fs.existsSync(serviceBuildScript)) {
            templatesBuildLogic.push(require(serviceBuildScript)({ settings, version, logger }));
          } else {
            logger.log(`BuildController::checkIssues: No service build file for '${serviceName}'. Looking in: '${serviceBuildScript}'`);
            failedServices.push({ serviceName: `No build file. Check logs for more details. Looking in: '${serviceBuildScript}'` });
          }
        });

        if (failedServices.length > 0) {
          return reject({
            component: 'BuildController::checkIssues',
            message: `One or more services failed to build: '${JSON.stringify(failedServices)}'`,
            error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
          });
        }

        // Instantiate each network's build logic
        Object.keys(outputStack.networks).forEach((networkName) => {
          const networkBuildScript = path.join(networksBuildPath, networkName, buildLogicFile);
          if (fs.existsSync(networkBuildScript)) {
            templatesBuildLogic.push(require(networkBuildScript)({ settings, version, logger }));
          } else {
            logger.log(`BuildController::checkIssues: No network build file for '${networkName}'. Looking in: '${networkBuildScript}'`);
          }
        });

        const issueList = {
          services: [],
          networks: [],
          other: []
        };

        // Compile service options to JSON output
        logger.debug('BuildController::checkIssues: Compile started');
        for (let i = 0; i < templatesBuildLogic.length; i++) {
          await templatesBuildLogic[i].compile({
            outputTemplateJson: outputStack,
            buildOptions,
          });
        }

        await Promise.allSettled(networkTemplatePromises).then((networkTemplateResults) => {
          networkTemplateResults.forEach((networkPromiseResult) => {
            if (networkPromiseResult.status === 'fulfilled' && networkPromiseResult.value) {
              const networkName = Object.keys(networkPromiseResult.value)[0];
              outputStack.networks[networkName] = networkPromiseResult.value[networkName];
            } else {
              failedStack.networks.push(networkPromiseResult);
            }
          });
          return outputStack;
        });
        logger.debug('BuildController::checkIssues: Compile complete');

        logger.debug('BuildController::checkIssues: Issue check started');
        return templatesBuildLogic.reduce((prom, buildLogic) => {
          return prom.then(() => {
            if (typeof buildLogic.issues === 'function') {
              return buildLogic.issues({
                outputTemplateJson: outputStack,
                buildOptions
              }).then((issueResults) => {
                if (Array.isArray(issueResults) && issueResults.length > 0) {
                  issueResults.forEach((issue) => {
                    if (issue.type === 'service') {
                      issueList.services.push(issue);
                    } else if (issue.type === 'network') {
                      issueList.networks.push(issue);
                    } else {
                      issueList.other.push(issue);
                    }
                  });
                }
              });
            }

            return Promise.resolve({ issueList });
          });
        }, Promise.resolve()).then(() => {
          logger.debug('BuildController::checkIssues: Issue check completed');
          return resolve({ issueList });
        }).catch((err) => {
          logger.error('BuildController::checkIssues: Issue check error: ', err);
          return reject({ issueList });
        });
      } catch (err) {
        logger.log(err);
        logger.trace();
        return reject({
          component: 'BuildController::checkIssues',
          message: 'Unhandled error occured',
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
      }
    });
  };

  retr.deletePreviousBuild = ({ host, buildTime }) => {
    return new Promise(async (resolve, reject) => {
      try {
        const {
          localBuildsDirectory
        } = settings.paths;

        const useBuildTime = buildTime.replace(/\//g, '');

        if (useBuildTime !== buildTime) {
          return reject({
            component: 'BuildController::deletePreviousBuild',
            message: `Build '${buildTime}' has an invalid name`
          });
        }

        const buildFiles = getFileList(localBuildsDirectory);
        let filesDeleted = [];

        buildFiles.forEach((fileName) => {
          const deconstructedFilename = fileName.split('_');
          if (deconstructedFilename.length === 2) {
            const checkBuildTime = deconstructedFilename[0];

            if (checkBuildTime === useBuildTime) {
              const fullPathZip = path.join(localBuildsDirectory, fileName);
              fs.unlinkSync(fullPathZip);
              filesDeleted.push(fileName);
            }
          }
        });

        if (filesDeleted.length < 1) {
          return reject({
            component: 'BuildController::deletePreviousBuild',
            message: `Build '${buildTime}' not found`
          });
        }
        return resolve({ filesDeleted, buildTime, host });
      } catch (err) {
        logger.log(err);
        logger.trace();
        return reject({
          component: 'BuildController::deletePreviousBuild',
          message: 'Unhandled error occured',
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
      }
    });
  };

  retr.getPreviousBuildsList = ({ host, buildTime, index, limit }) => {
    return new Promise(async (resolve, reject) => {
      try {
        const {
          localBuildsDirectory,
          buildDockerFilePostfix,
          buildOptionsFilePostfix,
          buildZipFilePostfix
        } = settings.paths;

        const buildFiles = getFileList(localBuildsDirectory);

        const buildsList = {};
        let singleBuild = {};

        buildFiles.forEach((fileName) => {
          const deconstructedFilename = fileName.split('_');
          if (deconstructedFilename.length === 2) {
            const checkBuildTime = deconstructedFilename[0];
            if (typeof buildsList[checkBuildTime] === 'undefined') {
              buildsList[checkBuildTime] = {};
            }

            if (fileName.endsWith(buildDockerFilePostfix)) {
              if (!buildTime) {
                buildsList[checkBuildTime] = {
                  ...buildsList[checkBuildTime],
                  yaml: fileName
                }
              } else {
                if (checkBuildTime === buildTime) {
                  singleBuild = {
                    ...singleBuild,
                    yaml: fileName
                  }
                }
              }
            }
  
            if (fileName.endsWith(buildOptionsFilePostfix)) {
              if (!buildTime) {
                buildsList[checkBuildTime] = {
                  ...buildsList[checkBuildTime],
                  json: fileName
                }
              } else {
                if (checkBuildTime === buildTime) {
                  singleBuild = {
                    ...singleBuild,
                    json: fileName
                  }
                }
              }
            }
  
            if (fileName.endsWith(buildZipFilePostfix)) {
              if (!buildTime) {
                buildsList[checkBuildTime] = {
                  ...buildsList[checkBuildTime],
                  zip: fileName
                }
              } else {
                if (checkBuildTime === buildTime) {
                  singleBuild = {
                    ...singleBuild,
                    zip: fileName
                  }
                }
              }
            }
          }
        });

        if (!buildTime) {
          const useLimit = limit ?? -1;
          const useIndex = index ?? 0;

          if (useLimit < 1) {
            return resolve({ buildsList, host });
          }

          const limitedBuildList = {};
          let currentCount = 0;
          Object.keys(buildsList).forEach((build, buildIndex) => {
            if (buildIndex >= useIndex) {
              currentCount++;
              if (currentCount <= useLimit) {
                limitedBuildList[build] = buildsList[build];
              }
            }
          });

          return resolve({ buildsList: limitedBuildList, host });
        } else {
          return resolve({ buildFiles: singleBuild, host });
        }
      } catch (err) {
        logger.log(err);
        logger.trace();
        return reject({
          component: 'BuildController::getPreviousBuildsList',
          message: 'Unhandled error occured',
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
      }
    });
  };

  retr.downloadPreviousBuildsList = ({ host, buildTime, type }) => {
    return new Promise(async (resolve, reject) => {
      try {
        if (!buildTime) {
          return reject({
            component: 'BuildController::downloadPreviousBuildsList',
            message: 'No build time specified'
          });
        }

        if (!type) {
          return reject({
            component: 'BuildController::downloadPreviousBuildsList',
            message: 'No download type specified'
          });
        }

        const {
          localBuildsDirectory,
          buildDockerFilePostfix,
          buildZipFilePostfix,
          buildOptionsFilePostfix,
          buildInstallerFilePostfix
        } = settings.paths;

        const buildFiles = getFileList(localBuildsDirectory);

        let singleBuild = {
          otherFiles: []
        };

        buildFiles.forEach((fileName) => {
          if (fileName.startsWith(buildTime)) {
            if (fileName.endsWith(buildDockerFilePostfix)) {
              singleBuild['yaml'] = fileName;
            } else if (fileName.endsWith(buildZipFilePostfix)) {
              singleBuild['zip'] = fileName;
            } else if (fileName.endsWith(buildOptionsFilePostfix)) {
              singleBuild['json'] = fileName;
            } else if (fileName.endsWith(buildInstallerFilePostfix)) {
              singleBuild['installer'] = fileName;
            } else {
              singleBuild.otherFiles.push(fileName);
            }
          }
        });

        if (type === 'yaml' || type === 'yml') {
          const fullPath = path.join(localBuildsDirectory, singleBuild['yaml']);
          const filename = buildDockerFilePostfix.substring(1); // Removes the prefixed underscope _ on filename
          return resolve({ fullPath, filename, path: localBuildsDirectory });
        }

        if (type === 'json') {
          const fullPath = path.join(localBuildsDirectory, singleBuild['json']);
          const filename = buildOptionsFilePostfix.substring(1); // Removes the prefixed underscope _ on filename
          return resolve({ fullPath, filename, path: localBuildsDirectory });
        }

        if (type === 'zip') {
          const fullPath = path.join(localBuildsDirectory, singleBuild['zip']);
          const filename = buildZipFilePostfix.substring(1); // Removes the prefixed underscope _ on filename
          return resolve({ fullPath, filename, path: localBuildsDirectory });
        }

        if (type === 'sh' || type === 'bash' || type === 'bootstrap') {
          const fullPath = path.join(localBuildsDirectory, singleBuild['bootstrap']);
          const filename = buildInstallerFilePostfix.substring(1); // Removes the prefixed underscope _ on filename
          return resolve({ fullPath, filename, path: localBuildsDirectory });
        }

        return reject({
          component: 'BuildController::downloadPreviousBuildsList',
          message: `Unknown type '${type}'`
        });
      } catch (err) {
        logger.log(err);
        logger.trace();
        return reject({
          component: 'BuildController::downloadPreviousBuildsList',
          message: 'Unhandled error occured',
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
      }
    });
  };

  return retr;
}
module.exports = BuildController;
