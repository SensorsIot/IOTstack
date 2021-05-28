import {
  REMOVE_FROM_FILTER_HIDE_LIST,
  ADD_TO_FILTER_HIDE_LIST
} from '../actions/updateFilterTags.action';

const defaultState = {
  hideServiceTags: []
};

const reducerHandler = (state = defaultState, action) => {
  const newState = JSON.parse(JSON.stringify(state));
  switch (action.type) {
    case `${REMOVE_FROM_FILTER_HIDE_LIST}`:
      newState.hideServiceTags.splice(newState.hideServiceTags.indexOf(action.data.filterTag), 1);
      return {
        ...state,
        ...newState
      };

      case `${ADD_TO_FILTER_HIDE_LIST}`:
        if (newState.hideServiceTags.indexOf(action.data.filterTag) < 0) {
          newState.hideServiceTags.push(action.data.filterTag);
        } else {
          console.warn(`Tag '${action.data.filterTag}' is already added!`);
          return {
            ...state
          }
        }
        return {
          ...state,
          ...newState
        };
  
    default:
      return state;
  }
};

export default reducerHandler;

export const updateHideServiceTagsSelector = (state) => {
  return state.hideServiceTags
};
