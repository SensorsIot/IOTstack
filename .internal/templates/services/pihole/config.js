const pihole = () => {
  const retr = {};

  const serviceName = 'pihole';

  retr.getConfigOptions = () => {
    return {
      serviceName, // Required
      labeledPorts: {
        "8089:80": 'http'
      },
      modifyableEnvironment: [
        {
          key: 'TZ',
          value: 'Etc/UTC'
        },
        {
          key: 'WEBPASSWORD',
          value: 'password'
        },
        {
          key: 'DNS1',
          value: '8.8.8.8'
        },
        {
          key: 'DNS2',
          value: '8.8.4.4'
        },
        {
          key: 'INTERFACE',
          value: 'eth0'
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
        "Website": 'https://pi-hole.net/',
        "Docker": 'https://hub.docker.com/r/pihole/pihole',
        "Source Code": 'https://github.com/pi-hole/pi-hole',
        rawMarkdownRemote: '', // Usually links to github raw help pages.
        rawMarkdownLocal: '', // Relative path to docs locally
        "IOTstack Documentation for {$displayName}": 'https://sensorsiot.github.io/IOTstack/Containers/Pi-hole/' // Usually links to the github page for this service.
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
      displayName: 'PiHole',
      serviceTypeTags: ['wui', 'dns', 'dashboard'],
      iconUri: '/logos/pihole.png'
    };
  };

  return retr;
};

module.exports = pihole;
