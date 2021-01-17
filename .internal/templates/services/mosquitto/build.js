const ServiceBuilder = ({
  settings,
  version,
  logger
}) => {
  const path = require('path');
  const retr = {};
  const serviceName = 'mosquitto';

  retr.init = () => {
    logger.debug(`ServiceBuilder:init() - '${serviceName}'`);
  };

  const checkServiceFilesCopied = () => {
    return `
if [[ ! -f ./services/mosquitto/mosquitto.conf ]]; then
  echo "Mosquitto config file is missing!"
  sleep 2
fi
`;
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
        const mosquittoConfFilePath = path.join(__dirname, settings.paths.serviceFiles, 'mosquitto.conf');
        zipList.push({
          fullPath: mosquittoConfFilePath,
          zipName: '/services/mosquitto/mosquitto.conf'
        });
        console.debug(`ServiceBuilder:build() - '${serviceName}' Added '${mosquittoConfFilePath}' to zip`);

        postbuildScripts.push({
          serviceName,
          comment: 'Ensure required service files exist for launch',
          multilineComment: null,
          code: checkServiceFilesCopied()
        });
        console.info(`ServiceBuilder:build() - '${serviceName}' completed`);
        return resolve();
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

  retr.issues = ({
    outputTemplateJson,
    buildOptions,
    tmpPath
  }) => {
    return new Promise((resolve, reject) => {
      try {
        console.info(`ServiceBuilder:issues() - '${serviceName}' started`);
        // Code here
        console.info(`ServiceBuilder:issues() - '${serviceName}' completed`);
        return resolve([]);
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

  return retr;
}

module.exports = ServiceBuilder;