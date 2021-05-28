const BuildsService = ({ server, settings, version, logger }) => {
  const path = require('path');
  const yaml = require('js-yaml');
  const fs = require('fs');
  const retr = {};

  retr.init = () => {
    logger.debug('BuildsService:init()');
  };

  retr.saveBuildYaml = ({ buildJson, fileTimePrefix }) => {
    return new Promise((resolve, reject) => {
      let yamlOutputFilePath;
      try {
        const { localBuildsDirectory, buildDockerFilePostfix  } = settings.paths;
        const yamlFilename = `${fileTimePrefix}${buildDockerFilePostfix}`;
        yamlOutputFilePath = path.join(localBuildsDirectory, yamlFilename);

        let yamlDoc = yaml.safeDump(buildJson, { scalarQuoteStyle: 'double' });
        yamlDoc = yamlDoc.replace(/'/g, '"'); // { scalarQuoteStyle: 'double' } doesn't seem to be working

        fs.writeFileSync(yamlOutputFilePath, yamlDoc, 'utf8');
        return resolve({ yamlOutputFilePath, yamlFilename });
      } catch (err) {
        console.log(err);
        console.trace();
        console.debug("\nParams:");
        console.debug({ buildJson });
        console.debug({ fileTimePrefix });
        console.debug({ yamlOutputFilePath });
        return reject({
          component: 'BuildsService::saveBuildYaml',
          message: 'Error saving yaml to file.',
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
      }
    });
  };

  retr.saveBuildOptions = ({ buildOptionsJson, fileTimePrefix }) => {
    return new Promise((resolve, reject) => {
      let jsonOutputFilePath;
      try {
        buildOptionsJson.build = fileTimePrefix;
        const { localBuildsDirectory, buildOptionsFilePostfix  } = settings.paths;
        const jsonFilename = `${fileTimePrefix}${buildOptionsFilePostfix}`;
        jsonOutputFilePath = path.join(localBuildsDirectory, jsonFilename);

        let jsonDoc = JSON.stringify(buildOptionsJson);

        fs.writeFileSync(jsonOutputFilePath, jsonDoc, 'utf8');
        return resolve({ jsonOutputFilePath, jsonFilename });
      } catch (err) {
        console.log(err);
        console.trace();
        console.debug("\nParams:");
        console.debug({ buildOptionsJson });
        console.debug({ fileTimePrefix });
        console.debug({ jsonOutputFilePath });
        return reject({
          component: 'BuildsService::saveBuildOptions',
          message: 'Error saving json to file.',
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
      }
    });
  };

  return retr;
}
module.exports = BuildsService;
