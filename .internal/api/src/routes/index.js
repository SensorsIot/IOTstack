const registerRouteHooks = ({ server, settings, version, logger } = {}) => {

  const healthRoutes = require('./health');
  healthRoutes({ server, settings, version, logger });

  const templatesRoutes = require('./templates');
  templatesRoutes({ server, settings, version, logger });

  const buildRoutes = require('./build');
  buildRoutes({ server, settings, version, logger });

  const configRoutes = require('./configs');
  configRoutes({ server, settings, version, logger });

  const staticRoutes = require('./static');
  staticRoutes({ server, settings, version, logger });
};

module.exports = registerRouteHooks;