import { getServiceTemplatesList } from '../services/templates'

const GET_SERVICE_TEMPLATE_LIST_ACTION = 'GET_SERVICE_TEMPLATE_LIST_ACTION';

const getServiceTemplateListAction = () => {
  return {
    type: GET_SERVICE_TEMPLATE_LIST_ACTION,
    promise: getServiceTemplatesList()
  }
};

export {
  GET_SERVICE_TEMPLATE_LIST_ACTION,
  getServiceTemplateListAction
};
