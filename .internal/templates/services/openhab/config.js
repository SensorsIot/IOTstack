const adminer = () => {
  const retr = {};

  const serviceName = 'adminer';

  retr.getConfigOptions = () => {
    return {
      serviceName, // Required
      labeledPorts: {
        "4050:4050": 'http',
        "4051:4051": 'ssl'
      },
      modifyableEnvironment: [
        {
          key: 'OPENHAB_HTTP_PORT',
          value: '4050'
        },
        {
          key: 'OPENHAB_HTTPS_PORT',
          value: '4051'
        },
        {
          key: 'EXTRA_JAVA_OPTS',
          value: '-Duser.timezone=Etc/UTC'
        }
      ],
      volumes: true,
      networks: false,
      logging: true
    }
  };

  retr.getHelp = () => {
    return {
      serviceName, // Required
      links: {
        "Website": 'https://www.openhab.org/', // Website of service
        "Docker": 'https://hub.docker.com/r/openhab/openhab/',
        "Source Code": 'https://github.com/openhab',
        "{$displayName} Documentation": 'https://www.openhab.org/docs/installation/docker.html',
        rawMarkdownRemote: '', // Usually links to github raw help pages.
        rawMarkdownLocal: '', // Relative path to docs locally
        "IOTstack Documentation for {$displayName}": 'https://sensorsiot.github.io/IOTstack/Containers/OpenHab/'
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
      displayName: 'Open Hab (untested)',
      serviceTypeTags: ['wui', 'dashboard', 'home automation'],
      iconUri: '/logos/openhab.png'
    };
  };

  return retr;
};

module.exports = adminer;
