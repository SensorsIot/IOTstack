const dashmachine = () => {
  const retr = {};

  const serviceName = 'dashmachine';

  retr.getConfigOptions = () => {
    return {
      serviceName, // Required
      labeledPorts: {
        "5000:5000": 'http'
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
        website: '', // Website of service
        serviceDocs: '', // Official link to docs of service
        "Docker": 'https://hub.docker.com/r/rmountjoy/dashmachine', // Docker of service
        "Source Code": 'https://github.com/rmountjoy92/DashMachine', // Sourcecode of service
        community: '', // Community link
        communityChat: '', // Discord, gitter etc
        other: '', // Other links
        rawMarkdownRemote: '', // Usually links to github raw help pages.
        rawMarkdownLocal: '', // Relative path to docs locally
        "IOTstack Documentation for {$displayName}": 'https://sensorsiot.github.io/IOTstack/Containers/DashMachine/' // Usually links to the github page for this service.
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
      displayName: 'DashMachine',
      serviceTypeTags: ['wui', 'dashboard'],
      iconUri: '/logos/dashmachine.png'
    };
  };

  return retr;
};

module.exports = dashmachine;
