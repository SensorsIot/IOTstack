import { getAllServicesConfigHelp } from '../services/configs';

const GET_ALL_SERVICES_CONFIG_HELP_ACTION = 'GET_ALL_SERVICES_CONFIG_HELP_ACTION';

const getAllServicesConfigHelpAction = () => {
  return {
    type: GET_ALL_SERVICES_CONFIG_HELP_ACTION,
    promise: getAllServicesConfigHelp()
  }
};

export {
  GET_ALL_SERVICES_CONFIG_HELP_ACTION,
  getAllServicesConfigHelpAction
};
