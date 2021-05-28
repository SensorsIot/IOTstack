import { getScriptTemplate } from '../services/templates'

const GET_SCRIPT_TEMPLATE = 'GET_SCRIPT_TEMPLATE';

const getScriptFromTemplateAction = ({ scriptName, options, linkRef }) => {
  return {
    type: GET_SCRIPT_TEMPLATE,
    promise: getScriptTemplate({ scriptName, options, linkRef }),
    label: scriptName
  }
};

export {
  GET_SCRIPT_TEMPLATE,
  getScriptFromTemplateAction
};
