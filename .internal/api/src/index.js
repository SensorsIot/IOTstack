let appVersion = require('../package.json').version;

let listenInterface = process.env?.API_INTERFACE ?? '0.0.0.0';
let listenPort = process.env?.API_PORT ?? '32128';
let wuiPort = process.env?.WUI_PORT ?? '32777';
let additionalCorsList = [];

process.on('SIGINT', () => {
  process.exit();
});

const processCliArgs = (args) => {
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {

      case '-if':
      case '--listen-interface': {
        listenInterface = args[i + 1];
        i++;
        break;
      }

      case '-cors':
      case '--cors': {
        try {
          additionalCorsList = [
            ...additionalCorsList,
            ...args[i + 1]?.split(',') ?? []
          ];
        } catch (err) {
          console.error('processCliArgs: Error on cors:');
          console.error(err);
          process.exit(1);
        }
        i++;
        break;
      }

      case '-p':
      case '--port': {
        try {
          if (Number.isFinite(Number.parseInt(args[i + 1]))) {
            listenPort = args[i + 1];
            i++;
            continue;
          }
          console.error(`listenPort '${args[i + 1]}' is not a number.`);
        } catch (err) {
          console.error('processCliArgs: Error on parseInt:');
          console.error(err);
          process.exit(1);
        }
        break;
      }
    }
  }
};

const checkCliParams = () => {
  const errorList = [];
  if (!listenInterface) {
    errorList.push(`[-if]: Listen interface not set.`);
  }

  if (!listenPort) {
    errorList.push(`[-p]: Listen port not set.`);
  }

  if (errorList.length > 0) {
    throw new Error(errorList.join("\r\n"));
  }
};

const processEnvVars = (envs) => {
  const { cors, CORS } = envs;

  try {
    additionalCorsList = [
      ...additionalCorsList,
      ...cors?.split(/[\s,]+/).map((c) => c && c.indexOf(':') < 0 ? `${c}:${wuiPort}` : (c || null)).filter((e) => e !== null) ?? []
    ];
    additionalCorsList = [
      ...additionalCorsList,
      ...CORS?.split(/[\s,]+/).map((c) => c && c.indexOf(':') < 0 ? `${c}:${wuiPort}` : (c || null)).filter((e) => e !== null) ?? []
    ];
  } catch (err) {
    console.error('processEnvVars: Error on cors:');
    console.error(err);
    process.exit(1);
  }
};

const init = () => {
  const logger = require('./logger')();
  
  logger.info(`IOTstack API Server has started. Version: '${appVersion}', Environment: '${process.env.NODE_ENV}'`);
  const settings = require('./settings')({ env: process.env.NODE_ENV, version: appVersion, logger });
  settings.cors.origins = [
    ...settings?.cors?.origins ?? [],
    ...additionalCorsList
  ];
  const serverSetupPromise = require('./httpInit')({ logger, listenInterface, listenPort, version: appVersion, settings });

  serverSetupPromise.then((runningServer) => {
    logger.info('Server ready.');
  }).catch((err) => {
    logger.error({ module: 'Main::Init()', section: 'serverSetupPromise', message: `${err}, stack: ${err.stack}` });
    process.exit(2);
  });
}

processCliArgs(process.argv);
checkCliParams();
processEnvVars(process.env)
init();