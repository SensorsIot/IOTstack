import { getBuildFile } from '../services/builds'

const GET_BUILD_FILE_ACTION = 'GET_BUILD_FILE_ACTION';

const getBuildFileAction = ({ build, type, label }) => {
  return {
    type: GET_BUILD_FILE_ACTION,
    promise: getBuildFile({ build, type }),
    label
  }
};

export {
  GET_BUILD_FILE_ACTION,
  getBuildFileAction
};
