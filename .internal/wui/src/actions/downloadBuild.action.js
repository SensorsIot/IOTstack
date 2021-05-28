import { downloadBuild } from '../services/builds'

const DOWNLOAD_BUILD = 'DOWNLOAD_BUILD';

const downloadBuildFile = ({ build, type, linkRef }) => {
  return {
    type: DOWNLOAD_BUILD,
    promise: downloadBuild({ build, type, linkRef }),
    label: build
  }
};

export {
  DOWNLOAD_BUILD,
  downloadBuildFile
};
