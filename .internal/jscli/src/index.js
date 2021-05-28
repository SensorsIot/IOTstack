const blessed = require('neo-blessed');

const appVersion = require('../package.json').version;

let listenInterface = process.env?.API_INTERFACE ?? '0.0.0.0';
let listenPort = process.env?.API_PORT ?? '32128';

const processEnvVars = (envs) => {
  const {
    HOSTUSER,
    IOTSTACKPWD,
    HOSTSSH_ADDR,
    HOSTSSH_PORT
  } = envs;
};

const init = () => {
  const logger = require('./logger')();
  process.stdin.removeAllListeners('data');
  const screen = blessed.screen({
    smartCSR: true,
    title: 'IOTstack JSCLI',
  });
  // screen.disableMouse();

  const MainMenu = require('./menus/main');

  const mainMenu = MainMenu({ screen, version: appVersion, logger });
  mainMenu.init();
  mainMenu.render();
  
}

processEnvVars(process.env)
init();