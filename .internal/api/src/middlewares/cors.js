const registerCors = ({ server, corsList, headerList, allowHttp = false, logger } = {}) => {
  server.use((req, res, next) => {
    const origin = req.headers.origin ? req.headers.origin.replace(/(^\w+:|^)\/\//, '') : '';
    const foundHeader = corsList.indexOf(origin) > -1 ? origin : '';

    if (foundHeader) {
      if (allowHttp) {
        res.setHeader('Access-Control-Allow-Origin', `http://${foundHeader}`);
      } else {
        res.setHeader('Access-Control-Allow-Origin', `https://${foundHeader}`);
      }

      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE, HEAD');
      res.setHeader('Access-Control-Allow-Headers', headerList.join(','));
      res.setHeader('Access-Control-Allow-Credentials', true);
    }
    next();
  });

  logger.info(`Cors settings loaded: Origins: [${corsList}] Headers: [${headerList}] Allow HTTP: ${allowHttp.toString()}.`);
};

module.exports = registerCors;