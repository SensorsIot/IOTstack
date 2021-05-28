const ConfigsView = ({ server, settings, version, logger } = {}) => {
  const ConfigsController = require('../controllers/configs');
  const retr = {};

  const configsController = ConfigsController({ server, settings, version, logger });

  retr.init = () => {
    configsController.init();
  };
  
  retr.getConfigOptions = (req, res, next) => {
    try {
      const { serviceName } = req.params;
      configsController.getConfigOptions({ serviceName }).then((result) => {
        return res.send(result);
      }).catch((err) => {
        logger.error(err);
        return res.status(500).send({
          component: 'ConfigsView::getConfigOptions',
          message: 'Error getting config options',
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
      });
    } catch (err) {
      logger.error(err);
      logger.log(req.body);
      return res.status(500).send({
        component: 'ConfigsView::getConfigOptions',
        message: 'Unhandled error',
        error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
      });
    }
  };

  retr.getAllConfigOptions = (req, res, next) => {
    try {
      configsController.getAllConfigOptions().then((result) => {
        return res.send(result);
      }).catch((err) => {
        logger.error(err);
        return res.status(500).send({
          component: 'ConfigsView::getAllConfigOptions',
          message: 'Error getting config options',
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
      });
    } catch (err) {
      logger.error(err);
      logger.log(req.body);
      return res.status(500).send({
        component: 'ConfigsView::getAllConfigOptions',
        message: 'Unhandled error',
        error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
      });
    }
  };

  retr.getHelp = (req, res, next) => {
    try {
      const { serviceName } = req.params;
      configsController.getHelp({ serviceName }).then((result) => {
        return res.send(result);
      }).catch((err) => {
        logger.error(err);
        return res.status(500).send({
          component: 'ConfigsView::getHelp',
          message: 'Error getting help',
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
      });
    } catch (err) {
      logger.error(err);
      logger.log(req.body);
      return res.status(500).send({
        component: 'ConfigsView::getHelp',
        message: 'Unhandled error',
        error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
      });
    }
  };

  retr.getAllHelp = (req, res, next) => {
    try {
      configsController.getAllHelp().then((result) => {
        return res.send(result);
      }).catch((err) => {
        logger.error(err);
        return res.status(500).send({
          component: 'ConfigsView::getAllHelp',
          message: 'Error getting help',
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
      });
    } catch (err) {
      logger.error(err);
      logger.log(req.body);
      return res.status(500).send({
        component: 'ConfigsView::getAllHelp',
        message: 'Unhandled error',
        error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
      });
    }
  };

  retr.getScripts = (req, res, next) => {
    try {
      const { serviceName, scriptName } = req.params;
      configsController.getScripts({ serviceName, scriptName }).then((result) => {
        return res.send(result);
      }).catch((err) => {
        logger.error(err);
        return res.status(500).send({
          component: 'ConfigsView::getScripts',
          message: 'Error getting scripts',
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
      });
    } catch (err) {
      logger.error(err);
      logger.log(req.body);
      return res.status(500).send({
        component: 'ConfigsView::getScripts',
        message: 'Unhandled error',
        error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
      });
    }
  };

  retr.getMeta = (req, res, next) => {
    try {
      const { serviceName } = req.params;
      configsController.getMeta({ serviceName }).then((result) => {
        return res.send(result);
      }).catch((err) => {
        logger.error(err);
        return res.status(500).send({
          component: 'ConfigsView::getMeta',
          message: 'Error getting help',
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
      });
    } catch (err) {
      logger.error(err);
      logger.log(req.body);
      return res.status(500).send({
        component: 'ConfigsView::getMeta',
        message: 'Unhandled error',
        error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
      });
    }
  };

  retr.getAllMeta = (req, res, next) => {
    try {
      configsController.getAllMeta().then((result) => {
        return res.send(result);
      }).catch((err) => {
        logger.error(err);
        return res.status(500).send({
          component: 'ConfigsView::getMeta',
          message: 'Error getting help',
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
      });
    } catch (err) {
      logger.error(err);
      logger.log(req.body);
      return res.status(500).send({
        component: 'ConfigsView::getMeta',
        message: 'Unhandled error',
        error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
      });
    }
  };

  return retr;
};

module.exports = ConfigsView;
