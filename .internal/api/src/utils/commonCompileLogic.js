const {
  getExternalVolume,
  getInternalVolume,
  replaceExternalVolume,
  getEnvironmentKey,
  getEnvironmentValue,
  replaceEnvironmentValue,
} = require('./dockerParse');

const {
  generateFileOrFolderName,
  generatePassword,
  generateAlphanumeric,
  generateRandomPort
} = require('./stringGenerate');

const { byName } = require('./interpolate');

const arraysEqual = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b)) {
    return false;
  }
  if (a === b) {
    return true;
  }

  if (a.length !== b.length) {
    return false;
  }

  a.sort();
  b.sort();

  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

const setCommonInterpolations = ({ stringList, inputString }) => {
  let result = [];
  if (Array.isArray(stringList)) {
    result = stringList.map((iString) => {
      return byName(iString, {
        randomPassword: generatePassword(),
        password: generatePassword(),
        adminPassword: generatePassword(),
        folderName: generateFileOrFolderName(),
        compiledTime: new Date().getTime(),
        randomAlphanumeric: generateAlphanumeric(),
        randomPort: generateRandomPort()
      });
    });
  }

  if (typeof inputString === 'string') {
    return byName(inputString, {
      randomPassword: generatePassword(),
      password: generatePassword(),
      adminPassword: generatePassword(),
      folderName: generateFileOrFolderName(),
      compiledTime: new Date().getTime(),
      randomAlphanumeric: generateAlphanumeric(),
      randomPort: generateRandomPort()
    });
  }

  return result;
};

const setImageTag = ({ buildTemplate, buildOptions, serviceName }) => {
  const serviceTemplate = buildTemplate?.services?.[serviceName];
  const serviceConfig = buildOptions?.configurations?.services?.[serviceName];
  const oldImage = serviceTemplate?.image;

  if (typeof(serviceTemplate?.image) === 'string' && (typeof(serviceConfig?.tag) === 'string')) {
    serviceTemplate.image = byName(serviceTemplate.image, {
      tag: serviceConfig.tag
    });
  }

  return oldImage !== serviceTemplate?.image;
};

const setModifiedPorts = ({ buildTemplate, buildOptions, serviceName }) => {
  const serviceTemplate = buildTemplate?.services?.[serviceName] ?? {};
  const serviceConfig = buildOptions?.configurations?.services?.[serviceName];

  const modifiedPortList = Object.keys(serviceConfig?.ports ?? {});
  let updated = false;

  if (serviceTemplate.network_mode === 'host') {
    delete buildTemplate?.services?.[serviceName]?.['ports'];
    return true;
  }

  for (let i = 0; i < modifiedPortList.length; i++) {
    (serviceTemplate?.ports ?? []).forEach((port, index) => {
      const eiPort = port.split('/')[0];
      if (eiPort === modifiedPortList[i]) {
        if (serviceTemplate.ports[index] !== serviceConfig.ports[modifiedPortList[i]]) {
          updated = true;
        }

        serviceTemplate.ports[index] = serviceConfig.ports[modifiedPortList[i]];
        serviceTemplate.ports[index] = setCommonInterpolations({ inputString: serviceTemplate.ports[index] });
      }
    });
  }

  return updated;
};

const setLoggingState = ({ buildTemplate, buildOptions, serviceName }) => {
  const serviceTemplate = buildTemplate?.services?.[serviceName];
  const serviceConfig = buildOptions?.configurations?.services?.[serviceName];

  const currentLogging = Object.keys(serviceTemplate?.logging ?? {});

  if (serviceConfig?.loggingEnabled === false) {
    if (serviceTemplate.logging) {
      delete serviceTemplate?.logging;
      return true;
    }
    return false;
  }

  return Object.keys(serviceTemplate?.logging ?? {}).length !== currentLogging.length;
};

const setNetworkMode = ({ buildTemplate, buildOptions, serviceName }) => {
  const serviceTemplate = buildTemplate?.services?.[serviceName] ?? {};
  const serviceConfig = buildOptions?.configurations?.services?.[serviceName];

  const currentNetworkMode = serviceTemplate?.['network_mode'];

  if (serviceConfig?.networkMode) {
    if (
      serviceTemplate['network_mode'] !== serviceConfig.networkMode
      && serviceConfig.networkMode !== 'unchanged'
      && serviceConfig.networkMode !== ''
    ) {
      serviceTemplate['network_mode'] = serviceConfig.networkMode;
    }

    if (serviceConfig.networkMode === 'none') {
      delete serviceTemplate['network_mode'];
    }

    if (serviceTemplate.network_mode === 'host') {
    delete buildTemplate?.services?.[serviceName]?.['ports'];
    }
  }

  return currentNetworkMode !== serviceTemplate['network_mode'];
};

const setNetworks = ({ buildTemplate, buildOptions, serviceName }) => {
  const serviceTemplate = buildTemplate?.services?.[serviceName];
  const serviceConfig = buildOptions?.configurations?.services?.[serviceName];
  let updated = false;

  const originalNetworks = [ ...serviceTemplate?.networks ?? [] ];

  const networksList = Object.keys(serviceConfig?.networks ?? {});
  if (networksList.length > 0) {
    serviceTemplate.networks = [];
    networksList.forEach((network) => {
      if (serviceConfig.networks[network] === true) {
        serviceTemplate.networks.push(network);
      }
    });
  }

  if (!arraysEqual(originalNetworks, serviceTemplate?.networks ?? [])) {
    updated = true;
  }

  return updated;
};

const setVolumes = ({ buildTemplate, buildOptions, serviceName }) => {
  const serviceTemplate = buildTemplate?.services?.[serviceName];
  const serviceConfig = buildOptions?.configurations?.services?.[serviceName];
  let updated = false;

  if (Array.isArray(serviceConfig?.volumes ?? false)) {
    serviceConfig.volumes.forEach((configVolume, volumeIndex) => {
      const configInternalVolume = getInternalVolume(configVolume);
      let found = false;
      for (let i = 0; i < (serviceTemplate?.volumes ?? []).length; i++) {
        const templateInternalVolume = getInternalVolume(serviceTemplate.volumes[i]);
  
        if (templateInternalVolume === configInternalVolume) {
          const configExternalVolume = getExternalVolume(configVolume);
          if (configExternalVolume === '') {
            serviceTemplate.volumes.splice(i, 1);
          } else {
            serviceTemplate.volumes[i] = replaceExternalVolume(configVolume, configExternalVolume);
            serviceTemplate.volumes[i] = setCommonInterpolations({ inputString: serviceTemplate.volumes[i] });
          }
          updated = true;
          found = true;
          break;
        }
      }

      if (!found) {
        serviceTemplate.volumes[i].push(configVolume);
      }
    });
  }

  return updated;
};

const setEnvironmentVariables = ({ buildTemplate, buildOptions, serviceName }) => {
  const serviceTemplate = buildTemplate?.services?.[serviceName];
  const serviceConfig = buildOptions?.configurations?.services?.[serviceName];
  let updated = false;

  if (Array.isArray(serviceConfig?.environment ?? false)) {
    serviceConfig.environment.forEach((configEnvironment, environmentIndex) => {
      const configEnvironmentKey = getEnvironmentKey(configEnvironment);
      let found = false;
      for (let i = 0; i < (serviceTemplate?.environment ?? []).length; i++) {
        const templateEnvironmentKey = getEnvironmentKey(serviceTemplate.environment[i]);

        if (templateEnvironmentKey === configEnvironmentKey) {
          const newEnvironmentValue = getEnvironmentValue(configEnvironment);
          if (newEnvironmentValue === '') {
            serviceTemplate.environment.splice(i, 1);
          } else {
            serviceTemplate.environment[i] = replaceEnvironmentValue(configEnvironment, newEnvironmentValue);
            serviceTemplate.environment[i] = setCommonInterpolations({ inputString: serviceTemplate.environment[i] });
          }
          updated = true;
          found = true;
          break;
        }
      }

      if (!found) {
        serviceTemplate.environment[i].push(configEnvironment);
      }
    });
  }

  return updated;
};

const setDevices = ({ buildTemplate, buildOptions, serviceName }) => {
  const serviceTemplate = buildTemplate?.services?.[serviceName];
  const serviceConfig = buildOptions?.configurations?.services?.[serviceName];
  let updated = false;

  const currentDevices = serviceTemplate?.devices ?? {};

  if (Array.isArray(serviceConfig?.devices ?? false)) {
    serviceTemplate.devices = serviceConfig?.devices?.map((device) => {
      if (device === '') {
        return null;
      }
      return device;
    }).filter((ele) => {
      return ele !== null;
    });
    updated = true;
  }

  const newDevices = serviceTemplate?.devices ?? {};

  if (currentDevices.length === 0) {
    delete serviceTemplate.devices;
  }

  if (arraysEqual(currentDevices, newDevices)) {
    updated = false;
  }

  return updated;
};

module.exports = {
  setImageTag,
  setModifiedPorts,
  setLoggingState,
  setNetworkMode,
  setNetworks,
  setVolumes,
  setEnvironmentVariables,
  setCommonInterpolations,
  setDevices
};
