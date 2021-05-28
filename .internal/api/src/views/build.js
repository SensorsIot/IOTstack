const BuildView = ({ server, settings, version, logger } = {}) => {
  const BuildsController = require('../controllers/build');
  const retr = {};

  const buildsController = BuildsController({ server, settings, version, logger });

  retr.init = () => {
    buildsController.init();
  };
  
  retr.buildStack = (req, res, next) => {
    try {
      const { buildOptions } = req.body;
      buildsController.buildStack({ buildOptions }).then((result) => {
        return res.send(result);
      }).catch((err) => {
        logger.error(err);
        return res.status(500).send({
          component: 'BuildView::buildStack',
          message: 'Error getting yaml template',
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
      });
    } catch (err) {
      logger.error(err);
      logger.log(req.body);
      return res.status(500).send({
        component: 'BuildView::buildStack',
        message: 'Unhandled error',
        error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
      });
    }
  };

  retr.checkIssues = (req, res, next) => {
    try {
      const { buildOptions } = req.body;
      buildsController.checkIssues({ buildOptions }).then((result) => {
        return res.send(result);
      }).catch((err) => {
        logger.error(err);
        return res.status(500).send({
          component: 'BuildView::checkIssues',
          message: 'Error getting yaml template',
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
      });
    } catch (err) {
      logger.error(err);
      logger.log(req.body);
      return res.status(500).send({
        component: 'BuildView::checkIssues',
        message: 'Unhandled error',
        error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
      });
    }
  };

  retr.getPreviousBuildsList = (req, res, next) => {
    const { buildTime, index, limit } = req.params;
    try {
      buildsController.getPreviousBuildsList({ host: req.headers.host, buildTime, index, limit }).then((result) => {
        return res.send(result);
      }).catch((err) => {
        logger.error(err);
        return res.status(500).send({
          component: 'BuildView::getPreviousBuildsList',
          message: 'Error getting build',
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
      });
    } catch (err) {
      logger.error(err);
      logger.log(req.body);
      return res.status(500).send({
        component: 'BuildView::getPreviousBuildsList',
        message: 'Unhandled error',
        error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
      });
    }
  };

  retr.deletePreviousBuild = (req, res, next) => {
    const { buildTime } = req.params;
    try {
      buildsController.deletePreviousBuild({ host: req.headers.host, buildTime }).then((result) => {
        return res.send(result);
      }).catch((err) => {
        logger.error(err);
        return res.status(500).send({
          component: 'BuildView::deletePreviousBuild',
          message: 'Error getting build',
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
      });
    } catch (err) {
      logger.error(err);
      logger.log(req.body);
      return res.status(500).send({
        component: 'BuildView::deletePreviousBuild',
        message: 'Unhandled error',
        error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
      });
    }
  };

  retr.downloadPreviousBuildsList = (req, res, next) => {
    const { buildTime, type } = req.params;
    try {
      buildsController.downloadPreviousBuildsList({ host: req.headers.host, buildTime, type }).then((result) => {
        if (!result.filename || !result.fullPath) {
          return res.status(500).send({
            component: 'BuildView::downloadPreviousBuildsList',
            message: 'Error getting build'
          });
        }

        return res.download(result.fullPath, result.filename);
      }).catch((err) => {
        logger.error(err);
        return res.status(500).send({
          component: 'BuildView::downloadPreviousBuildsList',
          message: 'Error getting build',
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
      });
    } catch (err) {
      logger.error(err);
      logger.log(req.body);
      return res.status(500).send({
        component: 'BuildView::downloadPreviousBuildsList',
        message: 'Unhandled error',
        error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
      });
    }
  };

  return retr;
};

module.exports = BuildView;
