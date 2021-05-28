const TemplatesService = ({ server, settings, version, logger }) => {
  const path = require('path');
  const yaml = require('js-yaml');
  const fs = require('fs');
  const retr = {};

  retr.init = () => {
    logger.debug('TemplatesService:init()');
  };

  retr.getServiceTemplateFromFile = (templateName, jsonified = false) => {
    return new Promise((resolve, reject) => {
      let templateYamlPath
      try {
        const { localTemplatesPath, localServicesRelativePath, localServicesTemplateYamlFilename } = settings.paths;
        templateYamlPath = path.join(localTemplatesPath, localServicesRelativePath, templateName, localServicesTemplateYamlFilename);
        if (jsonified) {
          const yamlDoc = yaml.safeLoad(fs.readFileSync(templateYamlPath, 'utf8'));
          return resolve(yamlDoc);
        }
        const yamlDoc = yaml.dump(yaml.safeLoad(fs.readFileSync(templateYamlPath, 'utf8')));
        return resolve(yamlDoc);
      } catch (err) {
        console.log(err);
        console.trace();
        console.debug("\nParams:");
        console.debug({ templateName });
        console.debug({ templateYamlPath });
        return reject({
          component: 'TemplatesService::getServiceTemplateFromFile',
          message: 'Error getting yaml template from file.',
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
      }
    });
  };

  retr.getNetworkTemplateFromFile = (templateName, jsonified = false) => {
    return new Promise((resolve, reject) => {
      let templateYamlPath
      try {
        const { localTemplatesPath, localNetworksRelativePath, localNetworkTemplateYamlFilename } = settings.paths;
        templateYamlPath = path.join(localTemplatesPath, localNetworksRelativePath, templateName, localNetworkTemplateYamlFilename);
        if (jsonified) {
          const yamlDoc = yaml.safeLoad(fs.readFileSync(templateYamlPath, 'utf8'));
          return resolve(yamlDoc);
        }
        const yamlDoc = yaml.dump(yaml.safeLoad(fs.readFileSync(templateYamlPath, 'utf8')));
        return resolve(yamlDoc);
      } catch (err) {
        console.log(err);
        console.trace();
        console.debug("\nParams:");
        console.debug({ templateName });
        console.debug({ templateYamlPath });
        return reject({
          component: 'TemplatesService::getNetworkTemplateFromFile',
          message: 'Error getting yaml template from file.',
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
      }
    });
  };

  return retr;
}
module.exports = TemplatesService;
