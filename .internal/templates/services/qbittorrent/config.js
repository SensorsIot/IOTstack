const qbittorrent = () => {
  const retr = {};

  const serviceName = 'qbittorrent';

  retr.getConfigOptions = () => {
    return {
      serviceName, // Required
      labeledPorts: {
        "15080:15080": 'http'
      },
      modifyableEnvironment: [
        {
          key: 'WEBUI_PORT',
          value: '15080'
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
        "Docker": 'https://hub.docker.com/r/linuxserver/qbittorrent',
        "Source Code": 'https://github.com/qbittorrent/qBittorrent',
        rawMarkdownRemote: '', // Usually links to github raw help pages.
        rawMarkdownLocal: '', // Relative path to docs locally
        "IOTstack Documentation for {$displayName}": 'https://sensorsiot.github.io/IOTstack/Containers/qBittorrent/'
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
      displayName: 'Q Bittorrent',
      serviceTypeTags: ['bittorrent', 'wui'],
      iconUri: '/logos/qbittorrent.svg'
    };
  };

  return retr;
};

module.exports = qbittorrent;
