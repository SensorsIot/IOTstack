import {
  REMOVE_FROM_SELECTED_SERVICES,
  ADD_TO_SELECTED_SERVICES,
  CLEAR_ALL_SELECTED_SERVICES
} from '../actions/updateSelectedServices.action';

const defaultState = {
  selectedServices: []
};

const reducerHandler = (state = defaultState, action) => {
  const newState = JSON.parse(JSON.stringify(state));
  switch (action.type) {
    case `${REMOVE_FROM_SELECTED_SERVICES}`:
      newState.selectedServices.splice(newState.selectedServices.indexOf(action.data.serviceName), 1);
      return {
        ...state,
        ...newState
      }

    case `${ADD_TO_SELECTED_SERVICES}`:
      if (newState.selectedServices.indexOf(action.data.serviceName) < 0) {
        newState.selectedServices.push(action.data.serviceName);
      } else {
        console.warn(`Service '${action.data.serviceName}' is already added!`);
        return {
          ...state
        }
      }
      return {
        ...state,
        ...newState
      }

    case `${CLEAR_ALL_SELECTED_SERVICES}`:
      newState.selectedServices = [];
      return {
        ...state,
        ...newState
      }
    
    default:
      return state
  }
};

export default reducerHandler;

export const updateSelectedServicesSelector = (state) => {
  return state.selectedServices
};
