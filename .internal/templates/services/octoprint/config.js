const deconz = () => {
  const retr = {};

  const serviceName = 'deconz';

  retr.getConfigOptions = () => {
    return {
      serviceName, // Required
      labeledPorts: {
        "9980:80": 'http',
        "9981:8080": 'other'
      },
      modifyableEnvironment: [
        {
          key: 'TZ',
          value: 'Etc/UTC'
        },
        {
          key: 'ENABLE_MJPG_STREAMER',
          value: ''
        },
        {
          key: 'MJPG_STREAMER_INPUT',
          value: ''
        },
        {
          key: 'CAMERA_DEV',
          value: ''
        }
      ],
      devices: true,
      volumes: true,
      networks: true,
      logging: true
    }
  };

  retr.getHelp = () => {
    return {
      serviceName, // Required
      links: {
        "Website": 'https://octoprint.org/', // Website of service
        "Docker": 'https://hub.docker.com/r/octoprint/octoprint',
        "Source Code": 'https://github.com/OctoPrint/',
        "{$displayName} Documentation": 'https://docs.octoprint.org/en/master/',
        "Community": 'https://community.octoprint.org/',
        "Community Chat (Discord)": 'https://discord.octoprint.org/',
        rawMarkdownRemote: '', // Usually links to github raw help pages.
        rawMarkdownLocal: '', // Relative path to docs locally
        "IOTstack Documentation for {$displayName}": 'https://sensorsiot.github.io/IOTstack/Containers/Octoprint/'
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
      displayName: 'Octoprint (Untested)',
      serviceTypeTags: ['3d printer'],
      iconUri: '/logos/octoprint.png'
    };
  };

  return retr;
};

module.exports = deconz;
