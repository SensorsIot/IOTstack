const portainer = () => {
  const retr = {};

  const serviceName = 'portainer';

  retr.getConfigOptions = () => {
    return {
      serviceName, // Required
      labeledPorts: {
        "9002:9000": 'http'
      },
      volumes: true,
      networks: true,
      logging: true
    }
  };

  retr.getHelp = () => {
    return {
      serviceName, // Required
      links: {
        "Website": 'https://portainer.io/',
        "Docker": 'https://hub.docker.com/r/portainer/portainer',
        "{$displayName} Documentation": 'https://documentation.portainer.io/',
        "Community": 'https://membership.portainer.io/',
        rawMarkdownRemote: '', // Usually links to github raw help pages.
        rawMarkdownLocal: '', // Relative path to docs locally
        "IOTstack Documentation for {$displayName}": 'https://sensorsiot.github.io/IOTstack/Containers/Portainer/'
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
      displayName: 'Portainer (untested)',
      serviceTypeTags: ['container manager', 'wui', 'deprecated', 'dashboard'],
      iconUri: '/logos/portainer.png'
    };
  };

  return retr;
};

module.exports = portainer;
