const tasmoadmin = () => {
  const retr = {};

  const serviceName = 'tasmoadmin';

  retr.getConfigOptions = () => {
    return {
      serviceName, // Required
      labeledPorts: {
        "8088:80": 'http'
      },
      volumes: true,
      networks: false,
      logging: true
    }
  };

  retr.getHelp = () => {
    return {
      serviceName, // Required
      links: {
        "Docker": 'https://hub.docker.com/r/raymondmm/tasmoadmin',
        "Source Code": 'https://github.com/reloxx13/TasmoAdmin',
        rawMarkdownRemote: '', // Usually links to github raw help pages.
        rawMarkdownLocal: '', // Relative path to docs locally
        "IOTstack Documentation for {$displayName}": 'https://sensorsiot.github.io/IOTstack/Containers/TasmoAdmin/'
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
      displayName: 'TasmoAdmin',
      serviceTypeTags: ['wui', 'iot'],
      iconUri: '/logos/tasmoadmin.png'
    };
  };

  return retr;
};

module.exports = tasmoadmin;
