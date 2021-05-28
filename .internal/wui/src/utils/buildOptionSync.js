const setBuildOptions = (newOptions) => {
  buildOptionsInit();
  localStorage.setItem('buildOptions', JSON.stringify(newOptions));
};

const getBuildOptions = () => {
  try {
    return JSON.parse(localStorage.getItem('buildOptions')) || {};
  } catch (err) {
    console.error('Error getting build options', err);
  }

  return {};
};

const setServiceOptions = (serviceName, options) => {
  buildOptionsInit();
  const currentBuildOptions = getBuildOptions();

  currentBuildOptions.services[serviceName] = options;

  localStorage.setItem('buildOptions', JSON.stringify(currentBuildOptions));
};

const buildOptionsInit = () => {
  const currentBuildOptions = getBuildOptions();

  if (!currentBuildOptions.services || typeof(currentBuildOptions.services) !== 'object') {
    currentBuildOptions.services = {};
  }

  if (!currentBuildOptions.networks || typeof(currentBuildOptions.networks) !== 'object') {
    currentBuildOptions.networks = {};
  }

  if (!currentBuildOptions.meta || typeof(currentBuildOptions.meta) !== 'object') {
    currentBuildOptions.meta = {};
  }

  localStorage.setItem('buildOptions', JSON.stringify(currentBuildOptions));
};

const setTemporaryBuildOptions = (newOptions) => {
  buildOptionsInit();
  sessionStorage.setItem('unsavedBuildOptions', JSON.stringify(newOptions));
};

const deleteTemporaryBuildOptions = () => {
  sessionStorage.removeItem('unsavedBuildOptions');
};

const getTemporaryBuildOptions = () => {
  try {
    return JSON.parse(sessionStorage.getItem('unsavedBuildOptions')) || {};
  } catch (err) {
    console.error('Error getting build options', err);
  }

  return {};
};

const setTemporaryServiceOptions = (serviceName, options) => {
  buildOptionsInit();
  const currentBuildOptions = getBuildOptions();

  currentBuildOptions.services[serviceName] = options;

  sessionStorage.setItem('unsavedBuildOptions', JSON.stringify(currentBuildOptions));
};

const setupTemporaryBuildOptions = () => {
  setTemporaryBuildOptions(getBuildOptions());
};

const saveTemporaryBuildOptions = () => {
  setBuildOptions(getTemporaryBuildOptions());
};

const getSelectedItems_services = () => {
  try {
    return JSON.parse(localStorage.getItem('selectedItems'))?.services || [];
  } catch (err) {
    console.error('Error getting build options', err);
  }

  return {};
};

const setSelectedItems_services = (newItems) => {
  const currentSelected = getSelectedItems_services()?.services ?? false;
  if (!Array.isArray(currentSelected)) {
    localStorage.setItem('selectedItems', JSON.stringify({ services: [] }));
  }

  localStorage.setItem('selectedItems', JSON.stringify({ services: newItems }));
};

module.exports = {
  getBuildOptions,
  setBuildOptions,
  buildOptionsInit,
  setServiceOptions,
  setTemporaryBuildOptions,
  getTemporaryBuildOptions,
  setTemporaryServiceOptions,
  setupTemporaryBuildOptions,
  saveTemporaryBuildOptions,
  deleteTemporaryBuildOptions,
  setSelectedItems_services,
  getSelectedItems_services
};
