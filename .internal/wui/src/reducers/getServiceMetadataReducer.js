import { API_STATUS } from '../constants'
import { GET_CONFIG_SERVICE_METADATA } from '../actions/getServiceMetadata.action';

const defaultState = {
  services: {
    pending: [],
    failed: {},
    completed: {}
  }
};

const reducerHandler = (state = defaultState, action) => {
  const newState = JSON.parse(JSON.stringify(state));
  switch (action.type) {
    case `${GET_CONFIG_SERVICE_METADATA}_${API_STATUS.PENDING}`:
      if (state.services.pending.indexOf(action.label) > -1) {
        console.warn(`getServiceMetadataReducer: '${action.label}' already dispatched`, action);
      }
      newState.services.pending.push(action.label);
      delete newState.services.completed[action.label];
      delete newState.services.failed[action.label];
      return {
        ...state,
        ...newState
      }

    case `${GET_CONFIG_SERVICE_METADATA}_${API_STATUS.SUCCESS}`:
      newState.services.completed[action.label] = {
        status: API_STATUS.SUCCESS,
        payload: action.res
      };
      delete newState.services.failed[action.label];
      newState.services.pending.splice(newState.services.pending.indexOf(action.label), 1);
      return {
        ...state,
        ...newState
      }

    case `${GET_CONFIG_SERVICE_METADATA}_${API_STATUS.FAILURE}`:
      newState.services.failed[action.label] = {
        status: API_STATUS.FAILURE,
        payload: undefined,
        error: JSON.stringify(action.error, Object.getOwnPropertyNames(action.error))
      };
      delete newState.services.completed[action.label];
      newState.services.pending.splice(newState.services.pending.indexOf(action.label), 1);
      return {
        ...state,
        ...newState
      }

    default:
      return state
  }
};

export default reducerHandler;

export const getConfigServiceMetadataSelector = (state) => {
  return state.configServiceMetadataSelector
};
