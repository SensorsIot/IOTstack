const gitea = () => {
  const retr = {};

  const serviceName = 'gitea';

  retr.getConfigOptions = () => {
    return {
      serviceName, // Required
      labeledPorts: {
        "9080:8080": 'http'
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
        "Website": 'https://gitea.io/', // Website of service
        "{$displayName} Swagger": 'https://try.gitea.io/api/swagger', // Official link to docs of service
        "{$displayName} Documentation": 'https://docs.gitea.io/en-us/', // Official link to docs of service
        "Docker": 'https://hub.docker.com/r/kunde21/gitea-arm', // Docker of service
        "Source Code": 'https://github.com/go-gitea/', // Sourcecode of service
        "Community": 'https://discourse.gitea.io/', // Community link
        "Community Chat": 'https://discord.gg/Gitea', // Discord, gitter etc
        other: '', // Other links
        rawMarkdownRemote: '', // Usually links to github raw help pages.
        rawMarkdownLocal: '', // Relative path to docs locally
        "IOTstack Documentation for {$displayName}": 'https://sensorsiot.github.io/IOTstack/Containers/Gitea/' // Usually links to the github page for this service.
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
      displayName: 'Gitea',
      serviceTypeTags: ['wui', 'git'],
      iconUri: '/logos/gitea.png'
    };
  };

  return retr;
};

module.exports = gitea;
