import { getServiceConfigOptions } from '../services/configs'

const GET_CONFIG_SERVICE_CONFIG_OPTIONS = 'GET_CONFIG_SERVICE_CONFIG_OPTIONS';

const getServiceConfigOptionsAction = (serviceName) => {
  return {
    type: GET_CONFIG_SERVICE_CONFIG_OPTIONS,
    promise: getServiceConfigOptions(serviceName),
    label: serviceName
  }
};

export {
  GET_CONFIG_SERVICE_CONFIG_OPTIONS,
  getServiceConfigOptionsAction
};
