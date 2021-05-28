const blessed = require('neo-blessed');

const MainMenu = ({ screen, settings, version, logger }) => {
  const retr = {};

  retr.init = () => {
    logger.debug('MainMenu:init()');
  };

  retr.render = () => {
    const box = blessed.box({
      top: 'center',
      left: 'center',
      width: '50%',
      height: '50%',
      content: 'Hello {bold}world{/bold}!',
      tags: true,
      border: {
        type: 'line'
      },
      style: {
        fg: 'white',
        bg: 'magenta',
        border: {
          fg: '#f0f0f0'
        },
        hover: {
          bg: 'green'
        }
      }
    });

    screen.append(box);
    screen.render();
  }

  return retr;
}
module.exports = MainMenu;
