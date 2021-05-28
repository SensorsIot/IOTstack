import { API_STATUS } from '../constants'
import { CREATE_AND_BUILD_STACK, RESET_STATE_CREATE_AND_BUILD_STACK } from '../actions/buildStack.action';

const defaultState = {
  status: API_STATUS.UNINIT
};

const reducerHandler = (state = defaultState, action) => {
  switch (action.type) {
    case RESET_STATE_CREATE_AND_BUILD_STACK:
     return {
       ...state,
      status: API_STATUS.UNINIT
     }

     case `${CREATE_AND_BUILD_STACK}_${API_STATUS.PENDING}`:
      return {
        ...state,
       status: API_STATUS.PENDING
      }
     
    case `${CREATE_AND_BUILD_STACK}_${API_STATUS.SUCCESS}`:
      return {
        ...state,
        status: API_STATUS.SUCCESS,
        payload: action.res
      }     

    case `${CREATE_AND_BUILD_STACK}_${API_STATUS.FAILURE}`:
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

export const getBuildStackSelector = (state) => {
  return state.buildStack
};
