const pihole = () => {
  const retr = {};

  const serviceName = 'redis';

  retr.getConfigOptions = () => {
    return {
      serviceName, // Required
      labeledPorts: {
        "6379:6379": 'tcp'
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
        "Website": 'https://redis.io/',
        "Docker": 'https://hub.docker.com/_/redis',
        "Source Code": 'https://github.com/redis/redis',
        "{$displayName} Documentation": 'https://redis.io/documentation',
        "Community": 'https://redis.io/community',
        "Community Chat (Discord)": 'https://discord.gg/redis',
        rawMarkdownRemote: '', // Usually links to github raw help pages.
        rawMarkdownLocal: '', // Relative path to docs locally
        "IOTstack Documentation for {$displayName}": 'https://sensorsiot.github.io/IOTstack/Containers/Redis/'
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
      displayName: 'Redis',
      serviceTypeTags: ['database', 'cache'],
      iconUri: '/logos/redis.png'
    };
  };

  return retr;
};

module.exports = pihole;
