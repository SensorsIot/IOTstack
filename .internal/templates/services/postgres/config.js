const postgres = () => {
  const retr = {};

  const serviceName = 'postgres';

  retr.getConfigOptions = () => {
    return {
      serviceName, // Required
      modifyableEnvironment: [
        {
          key: 'POSTGRES_USER',
          value: 'postuser'
        },
        {
          key: 'POSTGRES_PASSWORD',
          value: '{$randomPassword}'
        },
        {
          key: 'POSTGRES_DB',
          value: 'postdb'
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
        "Website": 'https://www.postgresql.org/',
        "Docker": 'https://hub.docker.com/_/postgres',
        "Source Code": 'https://github.com/docker-library/postgres/',
        rawMarkdownRemote: '', // Usually links to github raw help pages.
        rawMarkdownLocal: '', // Relative path to docs locally
        "IOTstack Documentation for {$displayName}": 'https://sensorsiot.github.io/IOTstack/Containers/PostgreSQL/'
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
      displayName: 'Postgres',
      serviceTypeTags: ['database'],
      iconUri: '/logos/postgres.png'
    };
  };

  return retr;
};

module.exports = postgres;
