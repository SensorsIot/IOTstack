const pihole = () => {
  const retr = {};

  const serviceName = 'pihole';

  retr.getConfigOptions = () => {
    return {
      serviceName, // Required
      labeledPorts: {
        "8089:8089": 'http',
        "3001:3001": 'http-setup'
      },
      volumes: true,
      networks: true,
      logging: true
    }
  };

  retr.getHelp = () => {
    return {
      serviceName, // Required
      links: {
        "Docker": 'https://hub.docker.com/r/adguard/adguardhome', // Docker of service
        "Source Code": 'https://github.com/AdguardTeam/AdGuardHome', // Sourcecode of service
        community: '', // Community link
        communityChat: '', // Discord, gitter etc
        other: '', // Other links
        rawMarkdownRemote: '', // Usually links to github raw help pages.
        rawMarkdownLocal: '', // Relative path to docs locally
        "IOTstack Documentation for {$displayName}": 'https://sensorsiot.github.io/IOTstack/Containers/AdGuardHome/' // Usually links to the github page for this service.
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
      displayName: 'AdGuard (Untested)',
      serviceTypeTags: ['wui', 'dns', 'dashboard'],
      iconUri: '/logos/adguardhome.png'
    };
  };

  return retr;
};

module.exports = pihole;
