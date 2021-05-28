const registerBuildRoutes = ({ server, settings, version, logger } = {}) => {
  const BuildView = require('../views/build');

  const buildView = BuildView({ server, settings, version, logger });

  buildView.init();

  server.post('/build/save', (req, res, next) => {
    buildView.buildStack(req, res, next);
  });

  server.post('/build/dryrun', (req, res, next) => {
    buildView.checkIssues(req, res, next);
  });

  server.get('/build/list', (req, res, next) => {
    buildView.getPreviousBuildsList(req, res, next);
  });

  server.get('/build/list/index/:index/limit/:limit', (req, res, next) => {
    buildView.getPreviousBuildsList(req, res, next);
  });

  server.get('/build/list/limit/:limit/index/:index', (req, res, next) => {
    buildView.getPreviousBuildsList(req, res, next);
  });

  server.get('/build/list/index/:index', (req, res, next) => {
    buildView.getPreviousBuildsList(req, res, next);
  });

  server.get('/build/list/limit/:limit', (req, res, next) => {
    buildView.getPreviousBuildsList(req, res, next);
  });

  server.get('/build/get/:buildTime', (req, res, next) => {
    buildView.getPreviousBuildsList(req, res, next);
  });

  server.get('/build/get/:buildTime/:type', (req, res, next) => {
    buildView.downloadPreviousBuildsList(req, res, next);
  });

  server.post('/build/delete/:buildTime', (req, res, next) => {
    buildView.deletePreviousBuild(req, res, next);
  });
};

module.exports = registerBuildRoutes;
