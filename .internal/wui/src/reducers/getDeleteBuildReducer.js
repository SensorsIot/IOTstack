import { API_STATUS } from '../constants'
import { DELETE_BUILD, RESET_STATE_DELETE_BUILD } from '../actions/deleteBuild.action';

const defaultState = {
  status: API_STATUS.UNINIT
};

const reducerHandler = (state = defaultState, action) => {
  switch (action.type) {
    case RESET_STATE_DELETE_BUILD:
     return {
       ...state,
      status: API_STATUS.UNINIT
     }

    case `${DELETE_BUILD}_${API_STATUS.PENDING}`:
    return {
      ...state,
      status: API_STATUS.PENDING
    }

    case `${DELETE_BUILD}_${API_STATUS.SUCCESS}`:
      return {
        ...state,
        status: API_STATUS.SUCCESS,
        payload: action.res
      }     

    case `${DELETE_BUILD}_${API_STATUS.FAILURE}`:
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

export const getDeleteBuildSelector = (state) => {
  return state.deleteBuild
};
