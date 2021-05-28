import { API_STATUS } from '../constants'
import { GET_SCRIPT_TEMPLATE } from '../actions/getScript.action';

const defaultState = {
  scripts: {
    pending: [],
    failed: {},
    completed: {}
  }
};

const reducerHandler = (state = defaultState, action) => {
  const newState = JSON.parse(JSON.stringify(state));
  switch (action.type) {
    case `${GET_SCRIPT_TEMPLATE}_${API_STATUS.PENDING}`:
      if (state.scripts.pending.indexOf(action.label) > -1) {
        console.warn(`getScriptTemplatesReducer: '${action.label}' already dispatched`, action);
      }
      newState.scripts.pending.push(action.label);
      delete newState.scripts.completed[action.label];
      delete newState.scripts.failed[action.label];
      return {
        ...state,
        ...newState
      }

    case `${GET_SCRIPT_TEMPLATE}_${API_STATUS.SUCCESS}`:
      newState.scripts.completed[action.label] = {
        status: API_STATUS.SUCCESS,
        payload: action.res
      };
      delete newState.scripts.failed[action.label];
      newState.scripts.pending.splice(newState.scripts.pending.indexOf(action.label), 1);
      return {
        ...state,
        ...newState
      }

    case `${GET_SCRIPT_TEMPLATE}_${API_STATUS.FAILURE}`:
      newState.scripts.failed[action.label] = {
        status: API_STATUS.FAILURE,
        payload: undefined,
        error: JSON.stringify(action.error, Object.getOwnPropertyNames(action.error))
      };
      delete newState.scripts.completed[action.label];
      newState.scripts.pending.splice(newState.scripts.pending.indexOf(action.label), 1);
      return {
        ...state,
        ...newState
      }

    default:
      return state
  }
};

export default reducerHandler;
