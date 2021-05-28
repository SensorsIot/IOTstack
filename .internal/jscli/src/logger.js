const Logger = () => {
  const retr = {};

  retr.debug = console.debug;
  retr.info = console.info;
  retr.log = console.log;
  retr.warn = console.warn;
  retr.error = console.error;

  return retr;
}

module.exports = Logger;
