import { getBuildIssues } from '../services/builds'

const CHECK_BUILD_ISSUES = 'CHECK_BUILD_ISSUES';

const getBuildIssuesAction = (selectedServices, configurations) => {
  return {
    type: CHECK_BUILD_ISSUES,
    promise: getBuildIssues({ selectedServices, configurations })
  }
};

export {
  CHECK_BUILD_ISSUES,
  getBuildIssuesAction
};
