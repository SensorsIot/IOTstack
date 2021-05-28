const Settings = ({ env, logger, version }) => {
  const path = require('path');

  logger.info(`Settings loaded. env: '${env}', AppVersion: '${version}'`);

  const retr = {
    cors: {
      origins: ["localhost", "127.0.0.1", "localhost:32777", "127.0.0.1:32777", "localhost:3000"],
      headers: ["Content-Type" ,"Origin", "Accept"]
    },
    paths: {
      localTemplatesPath: path.join(__dirname, '../templates/'),
      localTmpPath: path.join(__dirname, '/.tmp/'),
      localBuildsDirectory: path.join(__dirname, '../builds/'),
      localServicesRelativePath: '/services/',
      localNetworksRelativePath: '/networks/',
      localScriptsRelativePath: '/scripts/',
      localServicesTemplateYamlFilename: 'template.yml',
      localNetworkTemplateYamlFilename: 'template.yml',
      localServicesTemplateConfig: 'template.js',
      buildLogicFile: 'build.js',
      configLogicFile: 'config.js',
      buildDockerFilePostfix: '_docker-compose-base.yml',
      buildOptionsFilePostfix: '_build-options.json',
      buildZipFilePostfix: '_build.zip',
      buildInstallerFilePostfix: '_build-installer.sh',
      serviceFiles: '/serviceFiles/',
      buildFiles: '/buildFiles/'
    }
  };
  return retr;
}

module.exports = Settings;
