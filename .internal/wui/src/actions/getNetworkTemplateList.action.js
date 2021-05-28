import { getNetworkTemplatesList } from '../services/templates'

const GET_NETWORK_TEMPLATE_LIST_ACTION = 'GET_NETWORK_TEMPLATE_LIST_ACTION';

const getNetworkTemplateListAction = () => {
  return {
    type: GET_NETWORK_TEMPLATE_LIST_ACTION,
    promise: getNetworkTemplatesList()
  }
};

export {
  GET_NETWORK_TEMPLATE_LIST_ACTION,
  getNetworkTemplateListAction
};
