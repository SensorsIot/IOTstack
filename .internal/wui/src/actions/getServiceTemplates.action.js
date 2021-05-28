import { getServiceTemplates } from '../services/templates';

const GET_SERVICE_TEMPLATES_ACTION = 'GET_SERVICE_TEMPLATES_ACTION';

const getServiceTemplatesAction = () => {
  return {
    type: GET_SERVICE_TEMPLATES_ACTION,
    promise: getServiceTemplates()
  }
};

export {
  GET_SERVICE_TEMPLATES_ACTION,
  getServiceTemplatesAction
};
