const domoticz = () => {
  const retr = {};

  const serviceName = 'domoticz';

  retr.getConfigOptions = () => {
    return {
      serviceName, // Required
      labeledPorts: {
        "8080:8080": 'http',
        "1443:1443": 'ssl'
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
        "Website": 'https://www.domoticz.com/', // Website of service
        serviceDocs: '', // Official link to docs of service
        "Docker": 'https://hub.docker.com/r/linuxserver/domoticz/', // Docker of service
        "Source Code": 'https://github.com/linuxserver/docker-domoticz', // Sourcecode of service
        community: '', // Community link
        "Community Chat (Discord)": 'https://discord.gg/YWrKVTn', // Discord, gitter etc
        other: '', // Other links
        rawMarkdownRemote: '', // Usually links to github raw help pages.
        rawMarkdownLocal: '', // Relative path to docs locally
        "IOTstack Documentation for {$displayName}": 'https://sensorsiot.github.io/IOTstack/Containers/Domoticz/' // Usually links to the github page for this service.
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
      displayName: 'Domoticz',
      serviceTypeTags: ['wui', 'dashboard', 'home automation', 'iot', 'z-wave'],
      iconUri: '/logos/domoticz.png'
    };
  };

  return retr;
};

module.exports = domoticz;
