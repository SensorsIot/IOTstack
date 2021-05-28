const diyhue = () => {
  const retr = {};

  const serviceName = 'diyhue';

  retr.getConfigOptions = () => {
    return {
      serviceName, // Required
      labeledPorts: {
        "8070:8070": 'http'
      },
      modifyableEnvironment: [
        {
          key: 'TZ',
          value: 'Etc/UTC'
        },
        {
          key: 'IP',
          value: 'Your.LAN.IP'
        },
        {
          key: 'MAC',
          value: 'MAC:Address:Here'
        }
      ],
      volumes: false,
      networks: false,
      logging: true
    }
  };

  retr.getHelp = () => {
    return {
      serviceName, // Required
      links: {
        "Website": 'https://diyhue.org/', // Website of service
        serviceDocs: '', // Official link to docs of service
        "Docker": 'https://hub.docker.com/r/diyhue/core/', // Docker of service
        "Source Code": 'https://github.com/diyhue/diyHue', // Sourcecode of service
        community: '', // Community link
        communityChat: '', // Discord, gitter etc
        other: '', // Other links
        rawMarkdownRemote: '', // Usually links to github raw help pages.
        rawMarkdownLocal: '', // Relative path to docs locally
        "IOTstack Documentation for {$displayName}": 'https://sensorsiot.github.io/IOTstack/Containers/diyhue/' // Usually links to the github page for this service.
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
      displayName: 'diyhue',
      serviceTypeTags: ['wui', 'iot'],
      iconUri: '/logos/diyhue.png'
    };
  };

  return retr;
};

module.exports = diyhue;
