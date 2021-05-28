import { deleteBuild } from '../services/builds'

const DELETE_BUILD = 'DELETE_BUILD';
const RESET_STATE_DELETE_BUILD = 'RESET_STATE_DELETE_BUILD';

const deleteBuildAction = ({ build }) => {
  return {
    type: DELETE_BUILD,
    promise: deleteBuild({ build })
  }
};

const clearDeleteBuildAction = () => {
  return {
    type: RESET_STATE_DELETE_BUILD
  }
};

export {
  DELETE_BUILD,
  RESET_STATE_DELETE_BUILD,
  deleteBuildAction,
  clearDeleteBuildAction
};
