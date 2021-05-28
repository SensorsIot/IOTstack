const webthingsio_gateway = () => {
  const retr = {};

  const serviceName = 'webthingsio_gateway';

  retr.getConfigOptions = () => {
    return {
      serviceName, // Required
      labeledPorts: {
        "4060:8080": 'http',
        "4443:4443": 'other'
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
        "Website": 'https://webthings.io/gateway',
        "Docker": 'https://hub.docker.com/r/webthingsio/gateway',
        "Source Code": 'https://github.com/WebThingsIO/gateway',
        rawMarkdownRemote: '', // Usually links to github raw help pages.
        rawMarkdownLocal: '', // Relative path to docs locally
        "IOTstack Documentation for {$displayName}": 'https://sensorsiot.github.io/IOTstack/Containers/WebThings/'
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
      displayName: 'Web Things',
      serviceTypeTags: ['wui', 'iot'],
      iconUri: '/logos/webthings.png'
    };
  };

  return retr;
};

module.exports = webthingsio_gateway;
