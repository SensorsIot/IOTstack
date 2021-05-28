const mosquitto = () => {
  const retr = {};

  const serviceName = 'mosquitto';

  retr.getConfigOptions = () => {
    return {
      serviceName, // Required
      labeledPorts: {
        "1883:1883": 'mosquitto'
      },
      volumes: true,
      networks: true,
      logging: true
    };
  };

  retr.getHelp = () => {
    return {
      serviceName, // Required
      links: {
        "Website": 'https://mosquitto.org/', // Website of service
        "Docker": 'https://hub.docker.com/_/eclipse-mosquitto',
        "{$displayName} Documentation": 'https://mosquitto.org/documentation/',
        rawMarkdownRemote: '', // Usually links to github raw help pages.
        rawMarkdownLocal: '', // Relative path to docs locally
        "IOTstack Documentation for {$displayName}": 'https://sensorsiot.github.io/IOTstack/Containers/Mosquitto/' // Usually links to the github page for this service.
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
      displayName: 'Mosquitto',
      serviceTypeTags: ['mqtt', 'server'],
      iconUri: '/logos/mosquitto.png'
    };
  };

  return retr;
};

module.exports = mosquitto;
