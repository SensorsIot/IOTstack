const rtl_433 = () => {
  const retr = {};

  const serviceName = 'rtl_433';

  retr.getConfigOptions = () => {
    return {
      serviceName, // Required
      volumes: false,
      networks: false,
      logging: true
    }
  };

  retr.getHelp = () => {
    return {
      serviceName, // Required
      links: {
        "Source Code": 'https://github.com/merbanan/rtl_433',
        rawMarkdownRemote: '', // Usually links to github raw help pages.
        rawMarkdownLocal: '', // Relative path to docs locally
        "IOTstack Documentation for {$displayName}": 'https://sensorsiot.github.io/IOTstack/Containers/RTL_433-docker/'
      }
    };
  };

  retr.getCommands = () => {
    return {
      commands: {} // Key/value pair of helper commands user can run locally
    };
  };

  retr.getMeta = () => {
    return {
      serviceName, // Required
      displayName: 'RTL 433 (untested)',
      serviceTypeTags: ['wui', 'database manager']
    };
  };

  return retr;
};

module.exports = rtl_433;
