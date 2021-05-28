const fsUtils = require('../utils/fsUtils');

const TemplatesController = ({ server, settings, version, logger }) => {
  const TemplatesService = require('../services/templates');
  const { getDirectoryList, filterBadPathStrings } = require('../utils/fsUtils');
  const retr = {};

  const templatesService = TemplatesService({ server, settings, version, logger });
  const path = require('path');
  const fs = require('fs');
  const yaml = require('js-yaml');

  retr.init = () => {
    templatesService.init();
    logger.debug('TemplatesController:init()');
  };

  retr.getServiceTemplateAsYaml = (templateName) => {
    return new Promise((resolve, reject) => {
      try {
        if (!templateName) {
          return reject({
            component: 'TemplatesController::getServiceTemplateAsYaml',
            message: 'No template name passed'
          });
        }
        return templatesService.getServiceTemplateFromFile(templateName).then((result) => {
          return resolve(result);
        }).catch((err) => {
          return reject({
            component: 'TemplatesController::getServiceTemplateAsYaml',
            message: 'Unable to get template',
            error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
          });
        });
      } catch (err) {
        console.log(err);
        console.trace();
        return reject({
          component: 'TemplatesController::getServiceTemplateAsYaml',
          message: 'Unhandled error occured',
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
      }
    });
  };

  retr.getNetworkTemplateAsYaml = (templateName) => {
    return new Promise((resolve, reject) => {
      try {
        if (!templateName) {
          return reject({
            component: 'TemplatesController::getNetworkTemplateAsYaml',
            message: 'No template name passed'
          });
        }
        return templatesService.getNetworkTemplateFromFile(templateName).then((result) => {
          return resolve(result);
        }).catch((err) => {
          return reject({
            component: 'TemplatesController::getNetworkTemplateAsYaml',
            message: 'Unable to get template',
            error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
          });
        });
      } catch (err) {
        console.log(err);
        console.trace();
        return reject({
          component: 'TemplatesController::getNetworkTemplateAsYaml',
          message: 'Unhandled error occured',
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
      }
    });
  };

  retr.getServiceTemplateAsJson = (templateName) => {
    return new Promise((resolve, reject) => {
      try {
        if (!templateName) {
          return reject({
            component: 'TemplatesController::getServiceTemplateAsJson',
            message: 'No template name passed'
          });
        }
        return templatesService.getServiceTemplateFromFile(templateName, true).then((result) => {
          return resolve(result);
        }).catch((err) => {
          return reject({
            component: 'TemplatesController::getServiceTemplateAsJson',
            message: 'Unable to get template',
            error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
          });
        });
      } catch (err) {
        console.log(err);
        console.trace();
        return reject({
          component: 'TemplatesController::getServiceTemplateAsJson',
          message: 'Unhandled error occured',
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
      }
    });
  };

  retr.getNetworkTemplateAsJson = (templateName) => {
    return new Promise((resolve, reject) => {
      try {
        if (!templateName) {
          return reject({
            component: 'TemplatesController::getNetworkTemplateAsJson',
            message: 'No template name passed'
          });
        }
        return templatesService.getNetworkTemplateFromFile(templateName, true).then((result) => {
          return resolve(result);
        }).catch((err) => {
          return reject({
            component: 'TemplatesController::getNetworkTemplateAsJson',
            message: 'Unable to get template',
            error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
          });
        });
      } catch (err) {
        console.log(err);
        console.trace();
        return reject({
          component: 'TemplatesController::getNetworkTemplateAsJson',
          message: 'Unhandled error occured',
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
      }
    });
  };

  retr.getAllServiceTemplatesAsYaml = () => {
    return new Promise((resolve, reject) => {
      try {
        const { localTemplatesPath, localServicesRelativePath } = settings.paths;
        const serviceTemplatesList = getDirectoryList(path.join(localTemplatesPath, localServicesRelativePath));
        const promiseWaitList = [];
        serviceTemplatesList.forEach((serviceDirectory) => {
          promiseWaitList.push(templatesService.getServiceTemplateFromFile(serviceDirectory, true));
        });
        return Promise.allSettled(promiseWaitList).then((resultList) => {
           const serviceList = {};
           resultList.forEach((servicePromiseResult) => {
            if (servicePromiseResult.status === 'fulfilled' && servicePromiseResult.value) {
              const serviceName = Object.keys(servicePromiseResult.value)[0];
              serviceList[serviceName] = servicePromiseResult.value[serviceName];
            }
           });
          return resolve(yaml.dump(serviceList));
        }).catch((err) => {
          return reject({
            component: 'TemplatesController::getAllServiceTemplatesAsYaml',
            message: 'Unable to get templates',
            error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
          });
        });
      } catch (err) {
        console.log(err);
        console.trace();
        return reject({
          component: 'TemplatesController::getAllServiceTemplatesAsYaml',
          message: 'Unhandled error occured',
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
      }
    });
  };

  retr.getAllNetworkTemplatesAsYaml = () => {
    return new Promise((resolve, reject) => {
      try {
        const { localTemplatesPath, localNetworksRelativePath } = settings.paths;
        const networkTemplatesList = getDirectoryList(path.join(localTemplatesPath, localNetworksRelativePath));
        const promiseWaitList = [];
        networkTemplatesList.forEach((networkDirectory) => {
          promiseWaitList.push(templatesService.getNetworkTemplateFromFile(networkDirectory, true));
        });
        return Promise.allSettled(promiseWaitList).then((resultList) => {
           const networkList = {};
           resultList.forEach((networkPromiseResult) => {
            if (networkPromiseResult.status === 'fulfilled' && networkPromiseResult.value) {
              const networkName = Object.keys(networkPromiseResult.value)[0];
              networkList[networkName] = networkPromiseResult.value[networkName];
            }
           });
          return resolve(yaml.dump(networkList));
        }).catch((err) => {
          return reject({
            component: 'TemplatesController::getAllNetworkTemplatesAsYaml',
            message: 'Unable to get templates',
            error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
          });
        });
      } catch (err) {
        console.log(err);
        console.trace();
        return reject({
          component: 'TemplatesController::getAllNetworkTemplatesAsYaml',
          message: 'Unhandled error occured',
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
      }
    });
  };

  retr.getAllServiceTemplatesAsJson = () => {
    return new Promise((resolve, reject) => {
      try {
        const { localTemplatesPath, localServicesRelativePath } = settings.paths;
        const serviceTemplatesList = getDirectoryList(path.join(localTemplatesPath, localServicesRelativePath));
        const promiseWaitList = [];
        serviceTemplatesList.forEach((serviceDirectory) => {
          promiseWaitList.push(templatesService.getServiceTemplateFromFile(serviceDirectory, true));
        });
        return Promise.allSettled(promiseWaitList).then((resultList) => {
           const serviceList = {};
           resultList.forEach((servicePromiseResult) => {
            if (servicePromiseResult.status === 'fulfilled' && servicePromiseResult.value) {
              const serviceName = Object.keys(servicePromiseResult.value)[0];
              serviceList[serviceName] = servicePromiseResult.value[serviceName];
            }
           });
          return resolve(serviceList);
        }).catch((err) => {
          return reject({
            component: 'TemplatesController::getAllServiceTemplatesAsJson',
            message: 'Unable to get templates',
            error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
          });
        });
      } catch (err) {
        console.log(err);
        console.trace();
        return reject({
          component: 'TemplatesController::getAllServiceTemplatesAsJson',
          message: 'Unhandled error occured',
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
      }
    });
  };

  retr.getAllNetworkTemplatesAsJson = () => {
    return new Promise((resolve, reject) => {
      try {
        const { localTemplatesPath, localNetworksRelativePath } = settings.paths;
        const networkTemplatesList = getDirectoryList(path.join(localTemplatesPath, localNetworksRelativePath));
        const promiseWaitList = [];
        networkTemplatesList.forEach((networkDirectory) => {
          promiseWaitList.push(templatesService.getNetworkTemplateFromFile(networkDirectory, true));
        });
        return Promise.allSettled(promiseWaitList).then((resultList) => {
           const networkList = {};
           resultList.forEach((networkPromiseResult) => {
            if (networkPromiseResult.status === 'fulfilled' && networkPromiseResult.value) {
              const networkName = Object.keys(networkPromiseResult.value)[0];
              networkList[networkName] = networkPromiseResult.value[networkName];
            }
           });
          return resolve(networkList);
        }).catch((err) => {
          return reject({
            component: 'TemplatesController::getAllNetworkTemplatesAsJson',
            message: 'Unable to get templates',
            error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
          });
        });
      } catch (err) {
        console.log(err);
        console.trace();
        return reject({
          component: 'TemplatesController::getAllNetworkTemplatesAsJson',
          message: 'Unhandled error occured',
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
      }
    });
  };

  retr.getAllServiceTemplatesAsList = () => {
    return new Promise((resolve, reject) => {
      try {
        const { localTemplatesPath, localServicesRelativePath } = settings.paths;
        const serviceTemplatesList = getDirectoryList(path.join(localTemplatesPath, localServicesRelativePath));
        return resolve(serviceTemplatesList);
      } catch (err) {
        console.log(err);
        console.trace();
        return reject({
          component: 'TemplatesController::getAllServiceTemplatesAsList',
          message: 'Unhandled error occured',
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
      }
    });
  };

  retr.getAllNetworkTemplatesAsList = () => {
    return new Promise((resolve, reject) => {
      try {
        const { localTemplatesPath, localNetworksRelativePath } = settings.paths;
        const networkTemplatesList = getDirectoryList(path.join(localTemplatesPath, localNetworksRelativePath));
        return resolve(networkTemplatesList);
      } catch (err) {
        console.log(err);
        console.trace();
        return reject({
          component: 'TemplatesController::getAllNetworkTemplatesAsList',
          message: 'Unhandled error occured',
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
      }
    });
  };
  
  retr.getServiceTemplateFile = ({ templateName, filename }) => {
    return new Promise((resolve, reject) => {
      try {
        const useTemplateName = filterBadPathStrings(templateName);
        const useFilename = filterBadPathStrings(filename);
        const { localTemplatesPath, localServicesRelativePath, serviceFiles } = settings.paths;
        const servicePath = path.join(localTemplatesPath, localServicesRelativePath, useTemplateName);
        if (!fs.existsSync(servicePath)) {
          return reject({
            component: 'TemplatesController::getServiceTemplateFile',
            message: `Service '${templateName}' doesn't exist.`
          });
        }

        const serviceFilesPath = path.join(servicePath, serviceFiles);

        if (!fs.existsSync(serviceFilesPath)) {
          return reject({
            component: 'TemplatesController::getServiceTemplateFile',
            message: `Service '${templateName}' doesn't have any files to share.`
          });
        }

        const filePath = path.join(serviceFilesPath, useFilename);

        if (fs.existsSync(filePath)) {
          return resolve(filePath);
        }
        return reject({
          component: 'TemplatesController::getServiceTemplateFile',
          message: `File '${filename}' doesn't exist for service '${templateName}'`
        });
      } catch (err) {
        console.log(err);
        console.trace();
        console.debug("\nParams:");
        console.debug({ templateName });
        console.debug({ filename });
        return reject({
          component: 'TemplatesController::getServiceTemplateFile',
          message: 'Unhandled error occured',
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
      }
    });
  };
  
  retr.getScriptTemplateFile = ({ scriptName, options, req }) => {
    return new Promise(async (resolve, reject) => {
      try {
        const useScriptTemplateName = filterBadPathStrings(scriptName);
        const { localTemplatesPath, localScriptsRelativePath } = settings.paths;
        const scriptPath = path.join(localTemplatesPath, localScriptsRelativePath, useScriptTemplateName);
        if (!fs.existsSync(`${scriptPath}.js`)) {
          return reject({
            component: 'TemplatesController::getScriptTemplateFile',
            message: `Script '${scriptName}' doesn't exist.`
          });
        }

        delete require.cache[require.resolve(scriptPath)];
        const scriptToSend = require(scriptPath);

        const results = await scriptToSend({
          req,
          scriptName,
          options,
          server,
          settings,
          version,
          logger
        });

        return resolve(results);
      } catch (err) {
        console.log(err);
        console.trace();
        console.debug("\nParams:");
        console.debug({ scriptName });
        return reject({
          component: 'TemplatesController::getScriptTemplateFile',
          message: 'Unhandled error occured',
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
      }
    });
  };
  
  return retr;
}
module.exports = TemplatesController;
