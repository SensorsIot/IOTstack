const heimdall = () => {
  const retr = {};

  const serviceName = 'heimdall';

  retr.getConfigOptions = () => {
    return {
      serviceName, // Required
      modifyableEnvironment: [
        {
          key: 'TZ',
          value: 'Etc/UTC2'
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
        website: '', // Website of service
        "Docker": 'https://hub.docker.com/r/linuxserver/heimdall', // Docker of service
        "Source Code": 'https://github.com/linuxserver/Heimdall', // Sourcecode of service
        other: '', // Other links
        rawMarkdownRemote: '', // Usually links to github raw help pages.
        rawMarkdownLocal: '', // Relative path to docs locally
        "IOTstack Documentation for {$displayName}": 'https://sensorsiot.github.io/IOTstack/Containers/Heimdall/'
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
      displayName: 'Heimdall',
      serviceTypeTags: ['wui', 'database manager'],
      iconUri: '/logos/heimdall.png'
    };
  };

  return retr;
};

module.exports = heimdall;
