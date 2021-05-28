const HealthView = ({ server, settings, version, logger } = {}) => {
  const HealthController = require('../controllers/health');
  const retr = {};

  const healthController = HealthController({ server, settings, version, logger });

  retr.init = () => {
    healthController.init();
  };

  retr.health = (req, res, next) => {
    healthController.healthCheck().then((result) => {
      return res.send(result);
    }).catch((err) => {
      logger.error(err);
      return res.status(500).send(result);
    });
  };

  retr.healthCheckNoLog = (req, res, next) => {
    healthController.healthCheckNoLog().then((result) => {
      return res.send(result);
    }).catch((err) => {
      logger.error(err);
      return res.status(500).send(result);
    });
  };

  return retr;
};

module.exports = HealthView;
