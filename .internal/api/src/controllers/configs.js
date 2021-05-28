const ConfigsController = ({ server, settings, version, logger }) => {
  const { getDirectoryList, getFileList, emptyDirectory } = require('../utils/fsUtils');
  const retr = {};

  const path = require('path');
  const fs = require('fs');

  retr.init = () => {
    logger.debug('ConfigsController:init()');
  };

  retr.getConfigOptions = async ({ serviceName }) => {
    return new Promise(async (resolve, reject) => {
      let serviceBuildScript;
      try {
        const {
          localTemplatesPath,
          localServicesRelativePath,
          configLogicFile
        } = settings.paths;
        const servicesBuildPath = path.join(localTemplatesPath, localServicesRelativePath);
        serviceBuildScript = path.join(servicesBuildPath, serviceName, configLogicFile);

        const configLogic = require(serviceBuildScript)({
          settings,
          version,
          logger,
          servicesBuildPath,
          serviceBuildScript,
          serviceTemplatesList,
          serviceName
        });

        return resolve(configLogic.getConfigOptions());
      } catch (err) {
        console.log(err);
        console.trace();
        console.debug("\nParams:");
        console.debug({ serviceName });
        console.debug({ serviceBuildScript });
        return reject({
          component: 'ConfigsController::getConfigOptions',
          message: 'Unhandled error occured',
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
      }
    });
  };

  retr.getAllConfigOptions = async () => {
    return new Promise(async (resolve, reject) => {
      try {
        const {
          localTemplatesPath,
          localServicesRelativePath,
          configLogicFile
        } = settings.paths;
        const servicesMetadata = {};
        const serviceTemplatesList = getDirectoryList(path.join(localTemplatesPath, localServicesRelativePath));
        serviceTemplatesList.forEach((serviceName) => {
          const servicesBuildPath = path.join(localTemplatesPath, localServicesRelativePath);
          const serviceBuildScript = path.join(servicesBuildPath, serviceName, configLogicFile);

          const configLogic = require(serviceBuildScript)({
          settings,
          version,
          logger,
          servicesBuildPath,
          serviceBuildScript,
          serviceTemplatesList,
          serviceName
        });
          servicesMetadata[serviceName] = configLogic.getConfigOptions();
        });

        return resolve(servicesMetadata)
      } catch (err) {
        console.log(err);
        console.trace();
        return reject({
          component: 'ConfigsController::getAllConfigOptions',
          message: 'Unhandled error occured',
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
      }
    });
  };

  retr.getHelp = async ({ serviceName }) => {
    return new Promise(async (resolve, reject) => {
      let serviceBuildScript;
      try {
        const {
          localTemplatesPath,
          localServicesRelativePath,
          configLogicFile
        } = settings.paths;
        const servicesBuildPath = path.join(localTemplatesPath, localServicesRelativePath);
        serviceBuildScript = path.join(servicesBuildPath, serviceName, configLogicFile);

        const configHelp = require(serviceBuildScript)({
          settings,
          version,
          logger,
          servicesBuildPath,
          serviceBuildScript,
          serviceName
        });

        return resolve(configHelp.getHelp());
      } catch (err) {
        console.log(err);
        console.trace();
        console.debug("\nParams:");
        console.debug({ serviceName });
        console.debug({ serviceBuildScript });
        return reject({
          component: 'ConfigsController::getHelp',
          message: 'Unhandled error occured',
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
      }
    });
  };

  retr.getAllHelp = async () => {
    return new Promise(async (resolve, reject) => {
      try {
        const {
          localTemplatesPath,
          localServicesRelativePath,
          configLogicFile
        } = settings.paths;
        const servicesMetadata = {};
        const serviceTemplatesList = getDirectoryList(path.join(localTemplatesPath, localServicesRelativePath));

        serviceTemplatesList.forEach((serviceName) => {
          const servicesBuildPath = path.join(localTemplatesPath, localServicesRelativePath);
          const serviceBuildScript = path.join(servicesBuildPath, serviceName, configLogicFile);

          const configHelp = require(serviceBuildScript)({
            settings,
            version,
            logger,
            servicesBuildPath,
            serviceBuildScript,
            serviceName
          });

          servicesMetadata[serviceName] = configHelp.getHelp();
        });

        return resolve(servicesMetadata);
      } catch (err) {
        console.log(err);
        console.trace();
        console.debug("\nParams:");
        console.debug({ serviceName });
        console.debug({ serviceBuildScript });
        return reject({
          component: 'ConfigsController::getAllHelp',
          message: 'Unhandled error occured',
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
      }
    });
  };

  retr.getScripts = async ({ serviceName, scriptName }) => {
    return new Promise(async (resolve, reject) => {
      let serviceBuildScript;
      try {
        const {
          localTemplatesPath,
          localServicesRelativePath,
          configLogicFile
        } = settings.paths;
        const servicesBuildPath = path.join(localTemplatesPath, localServicesRelativePath);
        serviceBuildScript = path.join(servicesBuildPath, serviceName, configLogicFile);

        const configLogic = require(serviceBuildScript)({
          settings,
          version,
          logger,
          servicesBuildPath,
          serviceBuildScript,
          serviceName
        });

        if (scriptName) {
          return resolve(configLogic.getCommands().commands[scriptName]);
        }

        return resolve(configLogic.getCommands());
      } catch (err) {
        console.log(err);
        console.trace();
        console.debug("\nParams:");
        console.debug({ serviceName });
        console.debug({ serviceBuildScript });
        console.debug({ scriptName });
        return reject({
          component: 'ConfigsController::getScripts',
          message: 'Unhandled error occured',
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
      }
    });
  };

  retr.getMeta = async ({ serviceName }) => {
    return new Promise(async (resolve, reject) => {
      let serviceBuildScript;
      try {
        const {
          localTemplatesPath,
          localServicesRelativePath,
          configLogicFile
        } = settings.paths;
        const servicesBuildPath = path.join(localTemplatesPath, localServicesRelativePath);
        serviceBuildScript = path.join(servicesBuildPath, serviceName, configLogicFile);

        const configLogic = require(serviceBuildScript)({
          settings,
          version,
          logger,
          servicesBuildPath,
          serviceBuildScript,
          serviceName
        });

        return resolve(configLogic.getMeta());
      } catch (err) {
        console.log(err);
        console.trace();
        console.debug("\nParams:");
        console.debug({ serviceName });
        console.debug({ serviceBuildScript });
        return reject({
          component: 'ConfigsController::getMeta',
          message: 'Unhandled error occured',
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
      }
    });
  };

  retr.getAllMeta = async () => {
    return new Promise(async (resolve, reject) => {
      try {
        const {
          localTemplatesPath,
          localServicesRelativePath,
          configLogicFile
        } = settings.paths;
        const servicesMetadata = {};
        const serviceTemplatesList = getDirectoryList(path.join(localTemplatesPath, localServicesRelativePath));
        serviceTemplatesList.forEach((serviceName) => {
          const servicesBuildPath = path.join(localTemplatesPath, localServicesRelativePath);
          const serviceBuildScript = path.join(servicesBuildPath, serviceName, configLogicFile);

          const configLogic = require(serviceBuildScript)({
          settings,
          version,
          logger,
          servicesBuildPath,
          serviceBuildScript,
          serviceTemplatesList,
          serviceName
        });
          servicesMetadata[serviceName] = configLogic.getMeta();
        });

        return resolve(servicesMetadata)
      } catch (err) {
        console.log(err);
        console.trace();
        return reject({
          component: 'ConfigsController::getAllMeta',
          message: 'Unhandled error occured',
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
      }
    });
  };

  return retr;
}
module.exports = ConfigsController;
