import { API_STATUS } from '../constants'
import { GET_SERVICE_TEMPLATE_LIST_ACTION } from '../actions/getServiceTemplateList.action';

const defaultState = {
  status: API_STATUS.UNINIT
};

const reducerHandler = (state = defaultState, action) => {
  switch (action.type) {
    case `${GET_SERVICE_TEMPLATE_LIST_ACTION}_${API_STATUS.PENDING}`:
     return {
       ...state,
      status: API_STATUS.PENDING
     }
     
    case `${GET_SERVICE_TEMPLATE_LIST_ACTION}_${API_STATUS.SUCCESS}`:
      return {
        ...state,
        status: API_STATUS.SUCCESS,
        payload: action.res
      }     

    case `${GET_SERVICE_TEMPLATE_LIST_ACTION}_${API_STATUS.FAILURE}`:
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

export const getServiceTemplateListSelector = (state) => {
  return state.serviceTemplateList
};
