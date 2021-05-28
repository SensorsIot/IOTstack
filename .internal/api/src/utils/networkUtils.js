const getUniqueNetworkListFromServices = ({ services, logger }) => {
  try {
    const networkList = [];
    Object.keys(services).forEach((serviceName) => {
      if (Array.isArray(services[serviceName].networks)) {
        services[serviceName].networks.forEach((networkName) => {
          if (networkList.indexOf(networkName) < 0) {
            networkList.push(networkName);
          }
        });
      }
    });

    return networkList;
  } catch (err) {
    logger.error(err);
    console.trace();
    return [];
  }
};

module.exports = {
  getUniqueNetworkListFromServices
};
