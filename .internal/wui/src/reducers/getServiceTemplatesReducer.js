import { API_STATUS } from '../constants'
import { GET_SERVICE_TEMPLATES_ACTION } from '../actions/getServiceTemplates.action';

const defaultState = {
  status: API_STATUS.UNINIT,
  payload: {}
};

const reducerHandler = (state = defaultState, action) => {
  switch (action.type) {
    case `${GET_SERVICE_TEMPLATES_ACTION}_${API_STATUS.PENDING}`:
     return {
       ...state,
      status: API_STATUS.PENDING
     }
     
    case `${GET_SERVICE_TEMPLATES_ACTION}_${API_STATUS.SUCCESS}`:
      return {
        ...state,
        status: API_STATUS.SUCCESS,
        payload: action.res
      }     

    case `${GET_SERVICE_TEMPLATES_ACTION}_${API_STATUS.FAILURE}`:
      return {
        ...state,
        status: API_STATUS.FAILURE,
        payload: undefined,
        error: action.error
      }
   default:
    return state
  }
};

export default reducerHandler;

export const getServiceTemplatesSelector = (state) => {
  return state.serviceTemplates
};
