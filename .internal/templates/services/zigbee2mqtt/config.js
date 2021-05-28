const zigbee2mqtt = () => {
  const retr = {};

  const serviceName = 'zigbee2mqtt';

  retr.getConfigOptions = () => {
    return {
      serviceName, // Required
      labeledPorts: {
        "9080:8080": 'http'
      },
      volumes: true,
      devices: true,
      networks: false,
      logging: true
    }
  };

  retr.getHelp = () => {
    return {
      serviceName, // Required
      links: {
        "Website": 'https://www.zigbee2mqtt.io/',
        "Docker": 'https://hub.docker.com/r/koenkk/zigbee2mqtt/',
        "Source Code": 'https://github.com/koenkk/zigbee2mqtt',
        rawMarkdownRemote: '', // Usually links to github raw help pages.
        rawMarkdownLocal: '', // Relative path to docs locally
        "IOTstack Documentation for {$displayName}": 'https://sensorsiot.github.io/IOTstack/Containers/Zigbee2MQTT/'
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
      displayName: 'zigbee2mqtt (untested)',
      serviceTypeTags: ['zigbee', 'mqtt'],
      iconUri: '/logos/zigbee2mqtt.png'
    };
  };

  return retr;
};

module.exports = zigbee2mqtt;
