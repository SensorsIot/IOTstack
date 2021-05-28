const homer = () => {
  const retr = {};

  const serviceName = 'homer';

  retr.getConfigOptions = () => {
    return {
      serviceName, // Required
      labeledPorts: {
        "8881:8080": 'http'
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
        "Docker": 'https://hub.docker.com/r/b4bz/homer', // Website of service
        "Source Code": 'https://github.com/bastienwirtz/homer', // Website of service
        "Community Chat": 'https://gitter.im/homer-dashboard/community', // Discord, gitter etc
        rawMarkdownRemote: '', // Usually links to github raw help pages.
        rawMarkdownLocal: '', // Relative path to docs locally
        "IOTstack Documentation for {$displayName}": 'https://sensorsiot.github.io/IOTstack/Containers/Homer/' // Usually links to the github page for this service.
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
      displayName: 'Homer',
      serviceTypeTags: ['wui', 'dashboard'],
      iconUri: '/logos/homer.png'
    };
  };

  return retr;
};

module.exports = homer;
