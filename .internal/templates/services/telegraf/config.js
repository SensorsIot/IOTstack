const telegraf = () => {
  const retr = {};

  const serviceName = 'telegraf';

  retr.getConfigOptions = () => {
    return {
      serviceName, // Required
      volumes: true,
      networks: false,
      logging: true
    }
  };

  retr.getHelp = () => {
    return {
      serviceName, // Required
      links: {
        "Docker": 'https://hub.docker.com/_/telegraf',
        "Source Code": 'https://github.com/influxdata/telegraf',
        rawMarkdownRemote: '', // Usually links to github raw help pages.
        rawMarkdownLocal: '', // Relative path to docs locally
        "IOTstack Documentation for {$displayName}": 'https://sensorsiot.github.io/IOTstack/Containers/Telegraf/'
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
      displayName: 'Telegraf (untested)',
      serviceTypeTags: ['iot'],
      iconUri: '/logos/telegraf.png'
    };
  };

  return retr;
};

module.exports = telegraf;
