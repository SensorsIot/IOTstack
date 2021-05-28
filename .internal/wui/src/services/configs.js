import config from '../config';

const getServiceMetadata = (serviceName) => {
  return new Promise((resolve, reject) => {
    try {
      if (typeof serviceName !== 'string' || !serviceName) {
        console.error('getServiceMetadata: invalid serviceName: ', serviceName);
        console.trace();
        return reject('getServiceMetadata: invalid serviceName: ', serviceName);
      }

      return fetch(`${config.apiProtocol}${config.apiUrl}:${config.apiPort}/config/${serviceName}/meta`).then((response) => {
        return response.json().then((data) => {
          return resolve(data);
        }).catch((err) => {
          console.error('getServiceMetadata: error parsing JSON response:');
          console.error(response);
          return reject(JSON.stringify(err, Object.getOwnPropertyNames(err)));
        });
      }).catch((err) => {
        console.error('getServiceMetadata: error communicating with API.');
        console.error(err);
        return reject(JSON.stringify(err, Object.getOwnPropertyNames(err)));
      });
    } catch (err) {
      console.error('getServiceMetadata: an unhandled error occured');
      console.error(err);
      return reject(JSON.stringify(err, Object.getOwnPropertyNames(err)));
    }
  });
};

const getAllServicesMetadata = () => {
  return new Promise((resolve, reject) => {
    try {
      return fetch(`${config.apiProtocol}${config.apiUrl}:${config.apiPort}/config/meta`).then((response) => {
        return response.json().then((data) => {
          return resolve(data);
        }).catch((err) => {
          console.error('getAllServicesMetadata: error parsing JSON response:');
          console.error(response);
          return reject(JSON.stringify(err, Object.getOwnPropertyNames(err)));
        });
      }).catch((err) => {
        console.error('getAllServicesMetadata: error communicating with API.');
        console.error(err);
        return reject(JSON.stringify(err, Object.getOwnPropertyNames(err)));
      });
    } catch (err) {
      console.error('getAllServicesMetadata: an unhandled error occured');
      console.error(err);
      return reject(JSON.stringify(err, Object.getOwnPropertyNames(err)));
    }
  });
};

const getServiceConfigOptions = (serviceName) => {
  return new Promise((resolve, reject) => {
    try {
      if (typeof serviceName !== 'string' || !serviceName) {
        console.error('getServiceConfigOptions: invalid serviceName: ', serviceName);
        console.trace();
        return reject('getServiceConfigOptions: invalid serviceName: ', serviceName);
      }

      return fetch(`${config.apiProtocol}${config.apiUrl}:${config.apiPort}/config/${serviceName}/options`).then((response) => {
        return response.json().then((data) => {
          return resolve(data);
        }).catch((err) => {
          console.error('getServiceConfigOptions: error parsing JSON response:');
          console.error(response);
          return reject(JSON.stringify(err, Object.getOwnPropertyNames(err)));
        });
      }).catch((err) => {
        console.error('getServiceConfigOptions: error communicating with API.');
        console.error(err);
        return reject(JSON.stringify(err, Object.getOwnPropertyNames(err)));
      });
    } catch (err) {
      console.error('getServiceConfigOptions: an unhandled error occured');
      console.error(err);
      return reject(JSON.stringify(err, Object.getOwnPropertyNames(err)));
    }
  });
};

const getAllServicesConfigOptions = (serviceName) => {
  return new Promise((resolve, reject) => {
    try {
      return fetch(`${config.apiProtocol}${config.apiUrl}:${config.apiPort}/config/options`).then((response) => {
        return response.json().then((data) => {
          return resolve(data);
        }).catch((err) => {
          console.error('getAllServicesConfigOptions: error parsing JSON response:');
          console.error(response);
          return reject(JSON.stringify(err, Object.getOwnPropertyNames(err)));
        });
      }).catch((err) => {
        console.error('getAllServicesConfigOptions: error communicating with API.');
        console.error(err);
        return reject(JSON.stringify(err, Object.getOwnPropertyNames(err)));
      });
    } catch (err) {
      console.error('getAllServicesConfigOptions: an unhandled error occured');
      console.error(err);
      return reject(JSON.stringify(err, Object.getOwnPropertyNames(err)));
    }
  });
};

const getAllServicesConfigHelp = (serviceName) => {
  return new Promise((resolve, reject) => {
    try {
      return fetch(`${config.apiProtocol}${config.apiUrl}:${config.apiPort}/config/help`).then((response) => {
        return response.json().then((data) => {
          return resolve(data);
        }).catch((err) => {
          console.error('getAllServicesConfigHelp: error parsing JSON response:');
          console.error(response);
          return reject(JSON.stringify(err, Object.getOwnPropertyNames(err)));
        });
      }).catch((err) => {
        console.error('getAllServicesConfigHelp: error communicating with API.');
        console.error(err);
        return reject(JSON.stringify(err, Object.getOwnPropertyNames(err)));
      });
    } catch (err) {
      console.error('getAllServicesConfigHelp: an unhandled error occured');
      console.error(err);
      return reject(JSON.stringify(err, Object.getOwnPropertyNames(err)));
    }
  });
};

export {
  getServiceMetadata,
  getServiceConfigOptions,
  getAllServicesMetadata,
  getAllServicesConfigOptions,
  getAllServicesConfigHelp
};
