const HealthController = ({ server, settings, version, logger }) => {
  const retr = {};

  retr.init = () => {
    logger.debug('HealthController:init()');
  };

  retr.healthCheck = () => {
    const baseHealthResults = {
      server: "online",
      api: true,
      version
    };

    return new Promise((resolveHealth, rejectHealth) => {
      logger.log('HealthController:healthCheck()');
      return resolveHealth(baseHealthResults);
    });
  };

  retr.healthCheckNoLog = () => {
    const baseHealthResults = {
      server: "online",
      api: true,
      version
    };

    return new Promise((resolveHealth, rejectHealth) => {
      return resolveHealth(baseHealthResults);
    });
  };

  return retr;
}
module.exports = HealthController;
