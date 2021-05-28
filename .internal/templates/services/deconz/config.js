const deconz = () => {
  const retr = {};

  const serviceName = 'deconz';

  retr.getConfigOptions = () => {
    return {
      serviceName, // Required
      labeledPorts: {
        "8090:80": 'http',
        "433:433": 'ssl',
        "5900:5900": 'other'
      },
      modifyableEnvironment: [
        {
          key: 'DECONZ_VNC_MODE',
          value: '1'
        },
        {
          key: 'DECONZ_VNC_PASSWORD',
          value: '{$randomPassword}'
        },
        {
          key: 'DECONZ_DEVICE',
          value: '{$deconzSelectedDevice}'
        }
      ],
      devices: true,
      volumes: true,
      networks: true,
      deconzSelectedDevice: true,
      logging: true
    }
  };

  retr.getHelp = () => {
    return {
      serviceName, // Required
      links: {
        "Website": 'https://www.dresden-elektronik.com/wireless/software/deconz.html', // Website of service
        serviceDocs: '', // Official link to docs of service
        "Docker": 'https://hub.docker.com/r/marthoc/deconz', // Docker of service
        "Source Code": 'https://github.com/marthoc/docker-deconz', // Sourcecode of service
        community: '', // Community link
        communityChat: '', // Discord, gitter etc
        other: '', // Other links
        rawMarkdownRemote: '', // Usually links to github raw help pages.
        rawMarkdownLocal: '', // Relative path to docs locally
        "IOTstack Documentation for {$displayName}": 'https://sensorsiot.github.io/IOTstack/Containers/Deconz/' // Usually links to the github page for this service.
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
      displayName: 'Deconz',
      serviceTypeTags: ['iot'],
      iconUri: '/logos/deconz.png'
    };
  };

  return retr;
};

module.exports = deconz;
