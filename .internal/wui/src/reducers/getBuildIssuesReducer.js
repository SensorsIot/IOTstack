import { API_STATUS } from '../constants'
import { CHECK_BUILD_ISSUES } from '../actions/checkBuildIssues.action';

const defaultState = {
  status: API_STATUS.UNINIT
};

const reducerHandler = (state = defaultState, action) => {
  switch (action.type) {
    case `${CHECK_BUILD_ISSUES}_${API_STATUS.PENDING}`:
     return {
       ...state,
      status: API_STATUS.PENDING
     }
     
    case `${CHECK_BUILD_ISSUES}_${API_STATUS.SUCCESS}`:
      return {
        ...state,
        status: API_STATUS.SUCCESS,
        payload: action.res
      }     

    case `${CHECK_BUILD_ISSUES}_${API_STATUS.FAILURE}`:
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

export const getBuildIssuesSelector = (state) => {
  return state.buildIssues
};
