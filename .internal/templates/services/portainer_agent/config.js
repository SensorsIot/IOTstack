const portainer_agent = () => {
  const retr = {};

  const serviceName = 'portainer_agent';

  retr.getConfigOptions = () => {
    return {
      serviceName, // Required
      labeledPorts: {
        "9001:9001": 'api'
      },
      volumes: false,
      networks: true,
      logging: true
    }
  };

  retr.getHelp = () => {
    return {
      serviceName, // Required
      links: {
        "Website": 'https://portainer.io/',
        "Docker": 'https://hub.docker.com/r/portainer/agent',
        "{$displayName} Documentation": 'https://documentation.portainer.io/',
        "Community": 'https://membership.portainer.io/',
        rawMarkdownRemote: '', // Usually links to github raw help pages.
        rawMarkdownLocal: '', // Relative path to docs locally
        "IOTstack Documentation for {$displayName}": 'https://sensorsiot.github.io/IOTstack/Containers/Portainer-agent/'
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
      displayName: 'Portainer Agent',
      serviceTypeTags: ['container manager', 'docker'],
      iconUri: '/logos/portainer.png'
    };
  };

  return retr;
};

module.exports = portainer_agent;
