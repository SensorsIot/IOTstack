var serverController = ({ logger, listenInterface, listenPort, settings, version } = {}) => {
  const express = require('express');
  const middlewares = require('./middlewares/index');
  const routes = require('./routes/index');

  return new Promise((resolve, reject) => {
    try {
      const server = express();

      server.on('error', (err) => {
        logger.error(err);
        return reject(err);
      });

      middlewares({ app: server, cors: settings.cors, version, logger });
      routes({ server, settings, version, logger });

      server.listen(listenPort, listenInterface, () => {
        logger.info(`Listening on: ${listenInterface}:${listenPort}`);
        return resolve(server);
      });
    } catch(err) {
      logger.error(JSON.stringify(err, Object.getOwnPropertyNames(err)));
      return reject(JSON.stringify(err, Object.getOwnPropertyNames(err)));
    }
    
  });
}

module.exports = serverController;