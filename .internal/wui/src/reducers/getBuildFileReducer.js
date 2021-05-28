import { API_STATUS } from '../constants'
import { GET_BUILD_FILE_ACTION } from '../actions/getBuildFile.action';

const defaultState = {
  files: {
    pending: [],
    failed: {},
    completed: {}
  },
  status: API_STATUS.UNINIT,
  payload: null
};

const reducerHandler = (state = defaultState, action) => {
  const newState = JSON.parse(JSON.stringify(state));

  switch (action.type) {
    case `${GET_BUILD_FILE_ACTION}_${API_STATUS.PENDING}`:
      if (action?.label) {
        if (state.files.pending.indexOf(action.label) > -1) {
          console.warn(`getBuildFile: '${action.label}' already dispatched`, action);
        }
        newState.files.pending.push(action.label);
        delete newState.files.completed[action.label];
        delete newState.files.failed[action.label];
        return {
          ...state,
          ...newState
        };
      }
      return {
        ...state,
       status: API_STATUS.PENDING
      };

    case `${GET_BUILD_FILE_ACTION}_${API_STATUS.SUCCESS}`:
      if (action?.label) {
        newState.files.completed[action.label] = {
          status: API_STATUS.SUCCESS,
          payload: action.res
        };
        delete newState.files.failed[action.label];
        newState.files.pending.splice(newState.files.pending.indexOf(action.label), 1);
        return {
          ...state,
          ...newState
        };
      }
      return {
        ...state,
        status: API_STATUS.SUCCESS,
        payload: action.res
      };

    case `${GET_BUILD_FILE_ACTION}_${API_STATUS.FAILURE}`:
      if (action?.label) {
        newState.files.failed[action.label] = {
          status: API_STATUS.FAILURE,
          payload: undefined,
          error: JSON.stringify(action.error, Object.getOwnPropertyNames(action.error))
        };
        delete newState.files.completed[action.label];
        newState.files.pending.splice(newState.files.pending.indexOf(action.label), 1);
        return {
          ...state,
          ...newState
        }
      }
      return {
        ...state,
        status: API_STATUS.FAILURE,
        payload: undefined,
        error: action.error
      };

    default:
      return state
  }
};

export default reducerHandler;

export const getBuildFileSelector = (state) => {
  return state.buildFileSelector
};
