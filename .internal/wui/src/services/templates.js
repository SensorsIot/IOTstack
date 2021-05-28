import config from '../config';

const getServiceTemplatesList = () => {
  return new Promise((resolve, reject) => {
    try {
      return fetch(`${config.apiProtocol}${config.apiUrl}:${config.apiPort}/templates/services/list`).then((response) => {
        return response.json().then((data) => {
          return resolve(data);
        }).catch((err) => {
          console.error('getServiceTemplatesList: error parsing JSON response:');
          console.error(response);
          return reject(JSON.stringify(err, Object.getOwnPropertyNames(err)));
        });
      }).catch((err) => {
        console.error('getServiceTemplatesList: error communicating with API.');
        console.error(err);
        return reject(JSON.stringify(err, Object.getOwnPropertyNames(err)));
      });
    } catch (err) {
      console.error('getServiceTemplatesList: an unhandled error occured');
      console.error(err);
      return reject(JSON.stringify(err, Object.getOwnPropertyNames(err)));
    }
  });
};

const getServiceTemplates = () => {
  return new Promise((resolve, reject) => {
    try {
      return fetch(`${config.apiProtocol}${config.apiUrl}:${config.apiPort}/templates/services/json`).then((response) => {
        return response.json().then((data) => {
          return resolve(data);
        }).catch((err) => {
          console.error('getServiceTemplates: error parsing JSON response:');
          console.error(response);
          return reject(JSON.stringify(err, Object.getOwnPropertyNames(err)));
        });
      }).catch((err) => {
        console.error('getServiceTemplates: error communicating with API.');
        console.error(err);
        return reject(JSON.stringify(err, Object.getOwnPropertyNames(err)));
      });
    } catch (err) {
      console.error('getServiceTemplates: an unhandled error occured');
      console.error(err);
      return reject(JSON.stringify(err, Object.getOwnPropertyNames(err)));
    }
  });
};

const getNetworkTemplatesList = () => {
  return new Promise((resolve, reject) => {
    try {
      return fetch(`${config.apiProtocol}${config.apiUrl}:${config.apiPort}/templates/networks/list`).then((response) => {
        return response.json().then((data) => {
          return resolve(data);
        }).catch((err) => {
          console.error('getServiceTemplatesList: error parsing JSON response:');
          console.error(response);
          return reject(JSON.stringify(err, Object.getOwnPropertyNames(err)));
        });
      }).catch((err) => {
        console.error('getServiceTemplatesList: error communicating with API.');
        console.error(err);
        return reject(JSON.stringify(err, Object.getOwnPropertyNames(err)));
      });
    } catch (err) {
      console.error('getServiceTemplatesList: an unhandled error occured');
      console.error(err);
      return reject(JSON.stringify(err, Object.getOwnPropertyNames(err)));
    }
  });
};

const getScriptTemplate = ({ scriptName, options, linkRef }) => {
  return new Promise((resolve, reject) => {
    try {
      return fetch(
        `${config.apiProtocol}${config.apiUrl}:${config.apiPort}/templates/scripts/${linkRef ? 'download/' : ''}${scriptName}`,
        {
          method: 'POST',
          cache: 'no-cache',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ options })
        }).then((response) => {
          if (linkRef) {
            return response.blob().then((data) => {
              try {
                const href = window.URL.createObjectURL(data);
                const a = linkRef.current;
                a.download = `${scriptName}${options.build ? '_' + options.build : ''}.sh`;
                a.href = href;
                a.click();
                a.href = '';
              } catch (err) {
                console.error('getScriptTemplate: error creating link for blob download:');
                console.error(err)
              }

              return resolve(data);
            }).catch((err) => {
              console.error('getScriptTemplate: error parsing text response:');
              console.error(response);
              return reject(JSON.stringify(err, Object.getOwnPropertyNames(err)));
            });
          }
        return response.text().then((data) => {
          return resolve(data);
        }).catch((err) => {
          console.error('getScriptTemplate: error parsing text response:');
          console.error(response);
          return reject(JSON.stringify(err, Object.getOwnPropertyNames(err)));
        });
      }).catch((err) => {
        console.error('getScriptTemplate: error communicating with API.');
        console.error(err);
        return reject(JSON.stringify(err, Object.getOwnPropertyNames(err)));
      });
    } catch (err) {
      console.error('getScriptTemplate: an unhandled error occured');
      console.error(err);
      return reject(JSON.stringify(err, Object.getOwnPropertyNames(err)));
    }
  });
};

export {
  getScriptTemplate,
  getServiceTemplates,
  getNetworkTemplatesList,
  getServiceTemplatesList
};
