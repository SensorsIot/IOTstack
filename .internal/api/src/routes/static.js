const path = require('path');

const registerStaticRoutes = ({ server, settings, version, logger } = {}) => {
  const express = require('express');

  const statics = [
    {
      route: '/static/none',
      path: path.join(__dirname, '../../static/')
    }
  ];

  logger.debug('StaticRouter: Serving: ', statics);

  statics.forEach((staticServe) => {
    server.use(staticServe.route, express.static(staticServe.path));
  })
};

module.exports = registerStaticRoutes;
