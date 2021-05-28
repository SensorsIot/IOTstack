const transmission = () => {
  const retr = {};

  const serviceName = 'transmission';

  retr.getConfigOptions = () => {
    return {
      serviceName, // Required
      labeledPorts: {
        "9091:9091": 'http'
      },
      modifyableEnvironment: [
        {
          key: 'TZ',
          value: 'Etc/UTC'
        }
      ],
      volumes: true,
      networks: true,
      logging: true
    }
  };

  retr.getHelp = () => {
    return {
      serviceName, // Required
      links: {
        "Docker": 'https://hub.docker.com/r/linuxserver/transmission',
        "Github": 'https://github.com/linuxserver',
        "Community": 'https://fleet.linuxserver.io/',
        "Community Chat (Discord)": 'https://discord.gg/YWrKVTn',
        rawMarkdownRemote: '', // Usually links to github raw help pages.
        rawMarkdownLocal: '', // Relative path to docs locally
        "IOTstack Documentation for {$displayName}": 'https://sensorsiot.github.io/IOTstack/Containers/Transmission/'
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
      displayName: 'Transmission',
      serviceTypeTags: ['bittorrent', 'wui'],
      iconUri: '/logos/transmission.png'
    };
  };

  return retr;
};

module.exports = transmission;
