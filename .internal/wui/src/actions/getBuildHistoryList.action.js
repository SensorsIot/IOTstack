import { getBuildHistoryList } from '../services/builds'

const GET_BUILD_HISTORY_LIST_ACTION = 'GET_BUILD_HISTORY_LIST_ACTION';

const getBuildHistoryListAction = () => {
  return {
    type: GET_BUILD_HISTORY_LIST_ACTION,
    promise: getBuildHistoryList()
  }
};

export {
  GET_BUILD_HISTORY_LIST_ACTION,
  getBuildHistoryListAction
};
