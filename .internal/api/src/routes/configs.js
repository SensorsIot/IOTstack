const registerConfigRoutes = ({ server, settings, version, logger } = {}) => {
  const ConfigView = require('../views/configs');

  const configView = ConfigView({ server, settings, version, logger });

  configView.init();

  server.get('/config/:serviceName/options', (req, res, next) => {
    configView.getConfigOptions(req, res, next);
  });

  server.get('/config/:serviceName/help', (req, res, next) => {
    configView.getHelp(req, res, next);
  });

  server.get('/config/help', (req, res, next) => {
    configView.getAllHelp(req, res, next);
  });

  server.get('/config/:serviceName/scripts', (req, res, next) => {
    configView.getScripts(req, res, next);
  });

  server.get('/config/:serviceName/commands', (req, res, next) => {
    configView.getScripts(req, res, next);
  });

  server.get('/config/:serviceName/scripts/:scriptName', (req, res, next) => {
    configView.getScripts(req, res, next);
  });

  server.get('/config/:serviceName/script/:scriptName', (req, res, next) => {
    configView.getScripts(req, res, next);
  });

  server.get('/config/:serviceName/commands/:scriptName', (req, res, next) => {
    configView.getScripts(req, res, next);
  });

  server.get('/config/:serviceName/command/:scriptName', (req, res, next) => {
    configView.getScripts(req, res, next);
  });

  server.get('/config/:serviceName/meta', (req, res, next) => {
    configView.getMeta(req, res, next);
  });

  server.get('/config/meta', (req, res, next) => {
    configView.getAllMeta(req, res, next);
  });

  server.get('/config/options', (req, res, next) => {
    configView.getAllConfigOptions(req, res, next);
  });
};

module.exports = registerConfigRoutes;
