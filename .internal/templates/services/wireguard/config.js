const wireguard = () => {
  const retr = {};

  const serviceName = 'wireguard';

  retr.getConfigOptions = () => {
    return {
      serviceName, // Required
      labeledPorts: {
        "51820:51820": 'vpn'
      },
      modifyableEnvironment: [
        {
          key: 'TZ',
          value: 'Etc/UTC'
        },
        {
          key: 'SERVERURL',
          value: '{$wireguardDuckDns}'
        },
        {
          key: 'SERVERPORT',
          value: '{$wireguardInternalPort}'
        },
        {
          key: 'PEERS',
          value: '1'
        },
        {
          key: 'PEERDNS',
          value: 'auto'
        },
        {
          key: 'INTERNAL_SUBNET',
          value: '100.64.0.0/24'
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
        "Docker": 'https://hub.docker.com/r/linuxserver/wireguard',
        "Github": 'https://github.com/linuxserver',
        "Community": 'https://fleet.linuxserver.io/',
        "Community Chat (Discord)": 'https://discord.gg/YWrKVTn',
        rawMarkdownRemote: '', // Usually links to github raw help pages.
        rawMarkdownLocal: '', // Relative path to docs locally
        "IOTstack Documentation for {$displayName}": 'https://sensorsiot.github.io/IOTstack/Containers/Wireguard/'
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
      displayName: 'Wire Guard (untested)',
      serviceTypeTags: ['vpn'],
      iconUri: '/logos/wireguard.png'
    };
  };

  return retr;
};

module.exports = wireguard;
