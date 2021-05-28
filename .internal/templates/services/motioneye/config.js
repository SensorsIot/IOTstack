const motioneye = () => {
  const retr = {};

  const serviceName = 'motioneye';

  retr.getConfigOptions = () => {
    return {
      serviceName, // Required
      labeledPorts: {
        "8765:8765": 'http',
        "8081:60081": 'streaming1',
        "8082:60082": 'streaming2',
        "8083:60083": 'streaming3'
      },
      volumes: true,
      devices: true,
      networks: true,
      logging: true
    }
  };

  retr.getHelp = () => {
    return {
      serviceName, // Required
      links: {
        "Website": 'https://motion-project.github.io/', // Website of service
        "Docker": 'https://hub.docker.com/r/jshridha/motioneye',
        "Source Code": 'https://github.com/ccrisan/motioneye',
        "{$displayName} Documentation": 'https://github.com/ccrisan/motioneye/wiki',
        rawMarkdownRemote: '', // Usually links to github raw help pages.
        rawMarkdownLocal: '', // Relative path to docs locally
        "IOTstack Documentation for {$displayName}": 'https://sensorsiot.github.io/IOTstack/Containers/MotionEye/' // Usually links to the github page for this service.
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
      displayName: 'Motion Eye',
      serviceTypeTags: ['wui', 'physical security', 'video'],
      iconUri: '/logos/motioneye.png'
    };
  };

  return retr;
};

module.exports = motioneye;
