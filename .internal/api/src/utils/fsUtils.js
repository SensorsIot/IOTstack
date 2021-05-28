const fs = require('fs');
const path = require('path');

const filterBadPathStrings = (inputPath) => {
  let filteredPath = inputPath.split('..').join('');
  filteredPath = inputPath.split('~/').join('');

  return filteredPath;
}

const getDirectoryList = (directoryPath) => {
  const filteredPath = filterBadPathStrings(directoryPath);
  return fs.readdirSync(filteredPath, { withFileTypes: true })
  .filter((dirent) => { return dirent.isDirectory(); })
  .map((dirent) => { return dirent.name; });
};

const getFileList = (directoryPath) => {
  const filteredPath = filterBadPathStrings(directoryPath);
  return fs.readdirSync(filteredPath, { withFileTypes: true })
  .filter((dirent) => { return !dirent.isDirectory(); })
  .map((dirent) => { return dirent.name; });
};

const emptyDirectory = (directoryPath, ignoreList) => {
  fs.readdir(directoryPath, (err, files) => {
    if (err) throw err;
    files.forEach((file) => {
      if (Array.isArray(ignoreList) && ignoreList.indexOf(file) > -1) {
        return;
      }

      fs.unlink(path.join(directoryPath, file), err => {
        if (err) throw err;
      });
    });
  });
};

module.exports = {
  getDirectoryList,
  getFileList,
  emptyDirectory,
  filterBadPathStrings
};
