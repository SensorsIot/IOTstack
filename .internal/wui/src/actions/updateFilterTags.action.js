const ADD_TO_FILTER_HIDE_LIST = 'ADD_TO_FILTER_SHOW_LIST';
const REMOVE_FROM_FILTER_HIDE_LIST = 'REMOVE_FROM_FILTER_HIDE_LIST';

const addTagToHideListAction = (filterTag) => {
  return {
    type: ADD_TO_FILTER_HIDE_LIST,
    data: {
      filterTag
    }
  };
};

const removeTagFromHideListAction = (filterTag) => {
  return {
    type: REMOVE_FROM_FILTER_HIDE_LIST,
    data: {
      filterTag
    }
  };
};

export {
  ADD_TO_FILTER_HIDE_LIST,
  REMOVE_FROM_FILTER_HIDE_LIST,
  addTagToHideListAction,
  removeTagFromHideListAction
};
