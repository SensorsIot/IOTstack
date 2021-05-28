const path = require('path');

const nodered = ({
  settings,
  version,
  logger
}) => {
  const retr = {};

  const serviceName = 'nodered';

  retr.getConfigOptions = () => {
    const noderedModules = require(path.join(__dirname, settings.paths.buildFiles, 'addons.json'));

    return {
      serviceName, // Required
      labeledPorts: {
        "1880:1880": 'http'
      },
      volumes: true,
      networks: true,
      devices: true,
      nodered_npmSelection: noderedModules?.data?.addons ?? [],
      logging: true
    }
  };

  retr.getHelp = () => {
    return {
      serviceName, // Required
      links: {
        "Website": 'https://nodered.org/', // Website of service
        "Docker": 'https://hub.docker.com/r/nodered/node-red',
        "Source Code": 'https://github.com/node-red',
        "{$displayName} Documentation": 'https://nodered.org/docs/',
        "Community": 'https://discourse.nodered.org/',
        "{$displayName} Flows": 'https://flows.nodered.org/',
        "Youtube": 'https://www.youtube.com/channel/UCQaB8NXBEPod7Ab8PPCLLAA',
        "Blog": 'https://nodered.org/blog/',
        rawMarkdownRemote: '', // Usually links to github raw help pages.
        rawMarkdownLocal: '', // Relative path to docs locally
        "IOTstack Documentation for {$displayName}": 'https://sensorsiot.github.io/IOTstack/Containers/Node-RED/' // Usually links to the github page for this service.
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
      displayName: 'NodeRed',
      serviceTypeTags: ['wui', 'dashboard', 'low code', 'graphs', 'aggregator', 'iot', 'server'],
      iconUri: '/logos/nodered.png'
    };
  };

  return retr;
};

module.exports = nodered;
