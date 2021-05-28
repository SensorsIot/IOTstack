const TemplatesView = ({ server, settings, version, logger } = {}) => {
  const TemplatesController = require('../controllers/templates');
  const retr = {};

  const templatesController = TemplatesController({ server, settings, version, logger });

  retr.init = () => {
    templatesController.init();
  };
  
  retr.getServiceTemplateAsYaml = (req, res, next) => {
    const { templateName } = req.params;
    templatesController.getServiceTemplateAsYaml(templateName).then((result) => {
      return res.send(result);
    }).catch((err) => {
      logger.error(err);
      return res.status(500).send({
        component: 'TemplatesView::getServiceTemplateAsYaml',
        message: 'Error getting yaml template',
        error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
      });
    });
  };

  retr.getServiceTemplateAsJson = (req, res, next) => {
    const { templateName } = req.params;
    templatesController.getServiceTemplateAsJson(templateName).then((result) => {
      return res.send(result);
    }).catch((err) => {
      logger.error(err);
      return res.status(500).send({
        component: 'TemplatesView::getServiceTemplateAsJson',
        message: 'Error getting json template',
        error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
      });
    });
  };

  retr.getAllServiceTemplatesAsYaml = (req, res, next) => {
    templatesController.getAllServiceTemplatesAsYaml().then((result) => {
      return res.send(result);
    }).catch((err) => {
      logger.error(err);
      return res.status(500).send({
        component: 'TemplatesView::getAllServiceTemplatesAsYaml',
        message: 'Error getting yaml templates',
        error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
      });
    });
  };

  retr.getAllServiceTemplatesAsJson = (req, res, next) => {
    templatesController.getAllServiceTemplatesAsJson().then((result) => {
      return res.send(result);
    }).catch((err) => {
      logger.error(err);
      return res.status(500).send({
        component: 'TemplatesView::getAllServiceTemplatesAsJson',
        message: 'Error getting json templates',
        error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
      });
    });
  };

  retr.getAllServiceTemplatesAsList = (req, res, next) => {
    templatesController.getAllServiceTemplatesAsList().then((result) => {
      return res.send(result);
    }).catch((err) => {
      logger.error(err);
      return res.status(500).send({
        component: 'TemplatesView::getAllServiceTemplatesAsList',
        message: 'Error getting templates list',
        error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
      });
    });
  };

  retr.getNetworkTemplateAsYaml = (req, res, next) => {
    const { templateName } = req.params;
    templatesController.getNetworkTemplateAsYaml(templateName).then((result) => {
      return res.send(result);
    }).catch((err) => {
      logger.error(err);
      return res.status(500).send({
        component: 'TemplatesView::getNetworkTemplateAsYaml',
        message: 'Error getting yaml template',
        error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
      });
    });
  };

  retr.getNetworkTemplateAsJson = (req, res, next) => {
    const { templateName } = req.params;
    templatesController.getNetworkTemplateAsJson(templateName).then((result) => {
      return res.send(result);
    }).catch((err) => {
      logger.error(err);
      return res.status(500).send({
        component: 'TemplatesView::getNetworkTemplateAsJson',
        message: 'Error getting json template',
        error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
      });
    });
  };

  retr.getAllNetworkTemplatesAsYaml = (req, res, next) => {
    templatesController.getAllNetworkTemplatesAsYaml().then((result) => {
      return res.send(result);
    }).catch((err) => {
      logger.error(err);
      return res.status(500).send({
        component: 'TemplatesView::getAllNetworkTemplatesAsYaml',
        message: 'Error getting yaml templates',
        error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
      });
    });
  };

  retr.getAllNetworkTemplatesAsJson = (req, res, next) => {
    templatesController.getAllNetworkTemplatesAsJson().then((result) => {
      return res.send(result);
    }).catch((err) => {
      logger.error(err);
      return res.status(500).send({
        component: 'TemplatesView::getAllNetworkTemplatesAsJson',
        message: 'Error getting json templates',
        error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
      });
    });
  };

  retr.getAllNetworkTemplatesAsList = (req, res, next) => {
    templatesController.getAllNetworkTemplatesAsList().then((result) => {
      return res.send(result);
    }).catch((err) => {
      logger.error(err);
      return res.status(500).send({
        component: 'TemplatesView::getAllNetworkTemplatesAsList',
        message: 'Error getting templates list',
        error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
      });
    });
  };

  retr.getServiceTemplateFile = (req, res, next) => {
    const { templateName, filename } = req.params;
    templatesController.getServiceTemplateFile({ templateName, filename }).then((result) => {
      return res.download(result);
    }).catch((err) => {
      logger.error(err);
      return res.status(500).send({
        component: 'TemplatesView::getServiceTemplateFile',
        message: `Error getting template '${templateName}' file '${filename}'`,
        error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
      });
    });
  };
  
  retr.getScriptTemplate = (req, res, next) => {
    const { scriptName } = req.params;
    const { options } = req.body;
    templatesController.getScriptTemplateFile({ scriptName, options, req }).then((result) => {
      return res.send(result.data);
    }).catch((err) => {
      logger.error(err);
      return res.status(500).send({
        component: 'TemplatesView::getScriptTemplate',
        message: `Error getting script template '${scriptName}''`,
        error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
      });
    });
  };
  
  retr.downloadScriptTemplate = (req, res, next) => {
    const { scriptName } = req.params;
    const { options, contentTypeRequest } = req.body;
    const allowedContentTypes = [
      'text/plain',
      'text/csv',
      'text/html',
      'application/json'
    ];

    templatesController.getScriptTemplateFile({ scriptName, options, req }).then((result) => {
      const buildFilename = (typeof result.filename !== 'string' || !result.filename) ? scriptName : result.filename;

      const useContentType = allowedContentTypes.includes(contentTypeRequest) ? contentTypeRequest : 'text/plain';
      res.set({
        'Content-Disposition': `attachment; filename="${buildFilename}"`,
        'Content-Type': useContentType,
      });

      return res.send(result.data);
    }).catch((err) => {
      logger.error(err);
      return res.status(500).send({
        component: 'TemplatesView::downloadScriptTemplate',
        message: `Error getting script template '${scriptName}''`,
        error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
      });
    });
  };
  
  return retr;
};

module.exports = TemplatesView;
