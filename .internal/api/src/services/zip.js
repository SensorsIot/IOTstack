const ZipService = ({ server, settings, version, logger }) => {
  const path = require('path');
  const archiver = require('archiver');
  const fs = require('fs');
  const retr = {};

  retr.init = () => {
    logger.debug('ZipService:init()');
  };

  retr.zipFiles = ({ fileList, fileTimePrefix, archiveDirectoryList = [] }) => {
    return new Promise((resolve, reject) => {
      let zipOutputFilePath;
      try {
        const { localBuildsDirectory, buildZipFilePostfix  } = settings.paths;
        const zipFilename = `${fileTimePrefix}${buildZipFilePostfix}`;
        zipOutputFilePath = path.join(localBuildsDirectory, zipFilename);

        const outputStream = fs.createWriteStream(zipOutputFilePath);
        const archive = archiver('zip', {
          zlib: { level: 9 } // Sets the compression level.
        });

        archive.on('warning', (err) => {
          console.log({
            component: 'ZipService::zipFiles',
            message: 'A warning was raised',
            error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
          });
        });
        
        // good practice to catch this error explicitly
        archive.on('error', (err) => {
          console.error({
            component: 'ZipService::zipFiles',
            message: 'A warning was raised',
            error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
          });
          return reject({
            component: 'ZipService::zipFiles',
            message: 'Error saving zip.',
            error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
          })
        });

        outputStream.on('close', () => {
          console.debug(`Zip '${zipFilename}' created (${archive.pointer()} bytes) Files given: '${fileList.length}'.`);
          return resolve({ zipFilename, zipOutputFilePath });
        });

        archive.pipe(outputStream);

        if (Array.isArray(archiveDirectoryList) && archiveDirectoryList.length > 0) {
          archiveDirectoryList.forEach((directoryName) => {
            archive.append(null, { name: directoryName });
          });
        }

        fileList.forEach((filename) => {
          archive.file(filename.fullPath, { name: filename.zipName });
        });

        return archive.finalize();
      } catch (err) {
        console.log(err);
        console.trace();
        console.debug("\nParams:");
        console.debug({ fileList });
        console.debug({ fileTimePrefix });
        console.debug({ zipOutputFilePath });
        return reject({
          component: 'ZipService::zipFiles',
          message: 'Error saving zip.',
          error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        });
      }
    });
  };

  return retr;
}
module.exports = ZipService;
