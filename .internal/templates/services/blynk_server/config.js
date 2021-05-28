const blynk_server = () => {
  const retr = {};

  const serviceName = 'blynk_server';

  retr.getConfigOptions = () => {
    return {
      serviceName, // Required
      labeledPorts: {
        "8180:8080": 'http',
        "8441:8441": 'other',
        "9443:9443": 'ssl'
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
        "Website": 'https://blynk.io/', // Website of service
        "Official Documentation": 'http://docs.blynk.cc/', // Official link to docs of service
        docker: '', // Docker of service
        "Source Code": 'https://github.com/blynkkk/blynk-server', // Sourcecode of service
        "Community": 'https://community.blynk.cc/', // Community link
        communityChat: '', // Discord, gitter etc
        other: '', // Other links
        rawMarkdownRemote: '', // Usually links to github raw help pages.
        rawMarkdownLocal: '', // Relative path to docs locally
        "IOTstack Documentation for {$displayName}": 'https://sensorsiot.github.io/IOTstack/Containers/Blynk_server/' // Usually links to the github page for this service.
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
      displayName: 'Blynk Server (untested)',
      serviceTypeTags: ['wui', 'iot'],
      iconUri: '/logos/blynk.png'
    };
  };

  return retr;
};

module.exports = blynk_server;
