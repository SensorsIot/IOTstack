import { getAllServicesConfigOptions } from '../services/configs';

const GET_ALL_SERVICES_CONFIG_OPTIONS_ACTION = 'GET_ALL_SERVICES_CONFIG_OPTIONS_ACTION';

const getAllServicesConfigOptionsAction = () => {
  return {
    type: GET_ALL_SERVICES_CONFIG_OPTIONS_ACTION,
    promise: getAllServicesConfigOptions()
  }
};

export {
  GET_ALL_SERVICES_CONFIG_OPTIONS_ACTION,
  getAllServicesConfigOptionsAction
};
