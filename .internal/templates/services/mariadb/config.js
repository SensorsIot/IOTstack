const mariadb = () => {
  const retr = {};

  const serviceName = 'mariadb';

  retr.getConfigOptions = () => {
    return {
      serviceName, // Required
      modifyableEnvironment: [
        {
          key: 'TZ',
          value: 'Etc/UTC'
        },
        {
          key: 'MYSQL_ROOT_PASSWORD',
          value: '{$randomPassword}'
        },
        {
          key: 'MYSQL_DATABASE',
          value: 'default'
        },
        {
          key: 'MYSQL_USER',
          value: 'mariadbuser'
        },
        {
          key: 'MYSQL_PASSWORD',
          value: '{$randomPassword}'
        }
      ],
      volumes: true,
      networks: true,
      logging: true
    }
  };

  retr.getHelp = () => {
    return {
      serviceName, // Required
      links: {
        "Website": 'https://mariadb.org/', // Website of service
        "Docker": 'https://hub.docker.com/r/linuxserver/mariadb/',
        "{$displayName} Documentation": 'https://mariadb.org/documentation/',
        rawMarkdownRemote: '', // Usually links to github raw help pages.
        rawMarkdownLocal: '', // Relative path to docs locally
        "IOTstack Documentation for {$displayName}": 'https://sensorsiot.github.io/IOTstack/Containers/MariaDB/' // Usually links to the github page for this service.
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
      displayName: 'MariaDB',
      serviceTypeTags: ['database', 'sql'],
      iconUri: '/logos/mariadb.png'
    };
  };

  return retr;
};

module.exports = mariadb;
