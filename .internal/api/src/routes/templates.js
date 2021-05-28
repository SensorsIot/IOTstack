const registerTemplatesRoutes = ({ server, settings, version, logger } = {}) => {
  const TemplatesView = require('../views/templates');

  const templatesView = TemplatesView({ server, settings, version, logger });

  templatesView.init();

  server.get('/templates/services/:templateName/file/:filename', (req, res, next) => {
    templatesView.getServiceTemplateFile(req, res, next);
  });

  server.get('/templates/services/yaml', (req, res, next) => {
    templatesView.getAllServiceTemplatesAsYaml(req, res, next);
  });

  server.get('/templates/services/json', (req, res, next) => {
    templatesView.getAllServiceTemplatesAsJson(req, res, next);
  });

  server.get('/templates/services/list', (req, res, next) => {
    templatesView.getAllServiceTemplatesAsList(req, res, next);
  });

  server.get('/templates/services/yaml/:templateName', (req, res, next) => {
    templatesView.getServiceTemplateAsYaml(req, res, next);
  });

  server.get('/templates/services/json/:templateName', (req, res, next) => {
    templatesView.getServiceTemplateAsJson(req, res, next);
  });

  server.get('/templates/networks/yaml', (req, res, next) => {
    templatesView.getAllNetworkTemplatesAsYaml(req, res, next);
  });

  server.get('/templates/networks/json', (req, res, next) => {
    templatesView.getAllNetworkTemplatesAsJson(req, res, next);
  });

  server.get('/templates/networks/list', (req, res, next) => {
    templatesView.getAllNetworkTemplatesAsList(req, res, next);
  });

  server.get('/templates/networks/yaml/:templateName', (req, res, next) => {
    templatesView.getNetworkTemplateAsYaml(req, res, next);
  });

  server.get('/templates/networks/json/:templateName', (req, res, next) => {
    templatesView.getNetworkTemplateAsJson(req, res, next);
  });

  server.get('/templates/scripts/:scriptName*', (req, res, next) => {
    templatesView.getScriptTemplate(req, res, next);
  });

  server.get('/templates/scripts/download/:scriptName*', (req, res, next) => {
    templatesView.downloadScriptTemplate(req, res, next);
  });

  server.post('/templates/scripts/:scriptName*', (req, res, next) => {
    templatesView.getScriptTemplate(req, res, next);
  });

  server.post('/templates/scripts/download/:scriptName*', (req, res, next) => {
    templatesView.downloadScriptTemplate(req, res, next);
  });
};

module.exports = registerTemplatesRoutes;