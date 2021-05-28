const prometheus = () => {
  const retr = {};

  const serviceName = 'prometheus';

  retr.getConfigOptions = () => {
    return {
      serviceName, // Required
      labeledPorts: {
        "9080:8080": 'http'
      },
      volumes: false,
      networks: false,
      logging: true
    }
  };

  retr.getHelp = () => {
    return {
      serviceName, // Required
      links: {
        "Website": 'https://prometheus.io/',
        "Docker": 'https://hub.docker.com/r/prom/prometheus/',
        "{$displayName} Documentation": 'https://prometheus.io/docs/introduction/overview/',
        rawMarkdownRemote: '', // Usually links to github raw help pages.
        rawMarkdownLocal: '', // Relative path to docs locally
        "IOTstack Documentation for {$displayName}": 'https://sensorsiot.github.io/IOTstack/Containers/Prometheus/'
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
      displayName: 'Prometheus (untested)',
      serviceTypeTags: ['wui', 'database manager'],
      iconUri: '/logos/prometheus.svg'
    };
  };

  return retr;
};

module.exports = prometheus;
