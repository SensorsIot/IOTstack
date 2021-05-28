const home_assistant = () => {
  const retr = {};

  const serviceName = 'home_assistant';

  retr.getConfigOptions = () => {
    return {
      serviceName, // Required
      labeledPorts: {
        "8123:8123": 'http'
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
        "Website": 'https://www.home-assistant.io/', // Website of service
        "Docker": 'https://hub.docker.com/r/linuxserver/homeassistant', // Docker of service
        rawMarkdownRemote: '', // Usually links to github raw help pages.
        rawMarkdownLocal: '', // Relative path to docs locally
        "IOTstack Documentation for {$displayName}": 'https://sensorsiot.github.io/IOTstack/Containers/Home-Assistant/'
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
      displayName: 'Home Assistant (untested)',
      serviceTypeTags: ['wui', 'dashboard', 'home automation', 'iot'],
      iconUri: '/logos/homeassistant.png'
    };
  };

  return retr;
};

module.exports = home_assistant;
