const timescaledb = () => {
  const retr = {};

  const serviceName = 'timescaledb';

  retr.getConfigOptions = () => {
    return {
      serviceName, // Required
      modifyableEnvironment: [
        {
          key: 'POSTGRES_USER',
          value: 'timescaleuser'
        },
        {
          key: 'POSTGRES_PASSWORD',
          value: '{$randomPassword}'
        },
        {
          key: 'POSTGRES_DB',
          value: 'postdb'
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
        "Website": 'https://www.timescale.com/',
        "Docker": 'https://hub.docker.com/r/timescale/timescaledb',
        "Source Code": 'https://github.com/timescale/timescaledb',
        rawMarkdownRemote: '', // Usually links to github raw help pages.
        rawMarkdownLocal: '', // Relative path to docs locally
        "IOTstack Documentation for {$displayName}": 'https://sensorsiot.github.io/IOTstack/Containers/TimescaleDB/'
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
      displayName: 'Timescale DB',
      serviceTypeTags: ['timeseries', 'database'],
      iconUri: '/logos/timescaledb.png'
    };
  };

  return retr;
};

module.exports = timescaledb;
