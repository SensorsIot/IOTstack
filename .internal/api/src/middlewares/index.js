const registerMiddlewareHooks = ({ app, cors, logger } = {}) => {
  const bodyParser = require('body-parser');

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.disable('x-powered-by');

  const corsMiddleware = require('./cors');

  corsMiddleware({
    server: app,
    corsList: cors.origins,
    headerList: cors.headers,
    allowHttp: process.env.APP_ENV !== 'production',
    logger
  });
};

module.exports = registerMiddlewareHooks;