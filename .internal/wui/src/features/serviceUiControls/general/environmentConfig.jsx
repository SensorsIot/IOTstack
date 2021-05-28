import React, { Fragment, useState, useEffect } from 'react';
// import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import {
  getEnvironmentKey,
  getEnvironmentValue
} from '../../../utils/parsers';

const VolumesConfig = (props) => {

  const {
    serviceConfigOptions,
    serviceName,
    // setBuildOptions,
    getBuildOptions,
    // buildOptionsInit,
    // setServiceOptions,
    // setTemporaryBuildOptions,
    getTemporaryBuildOptions,
    setTemporaryServiceOptions,
    // setupTemporaryBuildOptions,
    // saveTemporaryBuildOptions,
    serviceTemplates,
    onChange
  } = props;

  const tempBuildOptions = getTemporaryBuildOptions();
  const yamlEnvironmentSettings = serviceTemplates?.[serviceName]?.environment || [];

  const [environmentSettings, setEnvironmentSettings] = useState(yamlEnvironmentSettings);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    // Check if there's a default value set in configs, and use it if so.
    const envBuildDefaultOptions = serviceConfigOptions?.modifyableEnvironment ?? [];
    const defaultEnvSettings = yamlEnvironmentSettings.map((envKV) => {
      const envKey = getEnvironmentKey(envKV);
      const defaultKV = envBuildDefaultOptions.find((modObj) => {
        return modObj.key === envKey;
      });

      if (defaultKV) {
        return `${envKey}=${defaultKV.value}`;
      }
      return envKV;
    });

    // Load options from persistant state
    if ((getBuildOptions().services?.[serviceName]?.environment?.length ?? 0) < 1 ) {
      setTemporaryServiceOptions(serviceName, {
        ...getBuildOptions().services?.[serviceName] ?? {},
        environment: defaultEnvSettings
      });
      setEnvironmentSettings(defaultEnvSettings);
    } else {
      setEnvironmentSettings(getBuildOptions().services?.[serviceName]?.environment);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      setTemporaryServiceOptions(serviceName, {
        ...tempBuildOptions?.services?.[serviceName] ?? {},
        environment: environmentSettings
      });
    }
  }, [
    environmentSettings
  ]);

  const onChangeCb = (environmentKey, event) => {
    const newEnvironmentValue = event.target.value;
    const temporaryEnvironment = [...environmentSettings];
    
    const environmentIndex = temporaryEnvironment.findIndex((index) => {
      return getEnvironmentKey(index) === environmentKey;
    });
    
    if (environmentIndex > -1) {
      temporaryEnvironment[environmentIndex] = `${environmentKey}=${newEnvironmentValue}`
    }

    setEnvironmentSettings(temporaryEnvironment);
    if (typeof(onChange) === 'function') {
      onChange(environmentKey, newEnvironmentValue);
    }
  };

  return (
    <Fragment>
      <Grid container spacing={3}>
        {Array.isArray(environmentSettings) && environmentSettings.map((environmentKeyValue) => {
          const environmentKey = getEnvironmentKey(environmentKeyValue);
          const environmentValue = getEnvironmentValue(environmentKeyValue);

          return (
            <Grid
              item
              xs={12}
              md={12}
              lg={5}
              xl={4}
              key={environmentKey}
            >
              <TextField
                id={`environmentConfig_${environmentKey}`}
                label={`Env Var: ${environmentKey} ${environmentValue === '' ? '(Deleted)' : ''}`}
                onChange={(event) => { onChangeCb(environmentKey, event) }}
                value={environmentValue}
                style={{ width: '100%' }}
              />
            </Grid>
          );
        })}
      </Grid>
    </Fragment>
  );
};

export default VolumesConfig;
