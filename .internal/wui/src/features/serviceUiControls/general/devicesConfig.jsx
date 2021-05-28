import React, { Fragment, useState, useEffect } from 'react';
// import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';

const DevicessConfig = (props) => {

  const {
    // serviceConfigOptions,
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
  const yamlDevicesSettings = serviceTemplates?.[serviceName]?.devices || [];

  const [devicesSettings, setDevicesSettings] = useState(yamlDevicesSettings);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if ((getBuildOptions().services?.[serviceName]?.devices?.length ?? 0) < 1 ) {
      setTemporaryServiceOptions(serviceName, {
        ...getBuildOptions().services?.[serviceName] ?? {},
        devices: yamlDevicesSettings
      });
    } else {
      setDevicesSettings(getBuildOptions().services?.[serviceName]?.devices);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      setTemporaryServiceOptions(serviceName, {
        ...tempBuildOptions?.services?.[serviceName] ?? {},
        devices: devicesSettings
      });
    }
  }, [
    devicesSettings
  ]);

  const onChangeCb = (oldDevice, event) => {
    const newDevice = event.target.value;
    const temporaryDevices = [...devicesSettings];
    
    const devicesIndex = temporaryDevices.findIndex((device) => {
      return oldDevice === device;
    });

    if (devicesIndex > -1) {
      temporaryDevices[devicesIndex] = newDevice;
    }

    setDevicesSettings(temporaryDevices);
    if (typeof(onChange) === 'function') {
      onChange(oldDevice, newDevice);
    }
  };

  return (
    <Fragment>
      <Grid container spacing={3}>
        {devicesSettings.map((device, index) => {

          return (
            <Grid
              item
              xs={12}
              md={12}
              lg={5}
              xl={4}
              key={index}
            >
              <TextField
                id={`devicesConfig_${device}`}
                label={`devices: ${device === '' ? '(Deleted)' : ''}`}
                onChange={(event) => { onChangeCb(device, event) }}
                value={device}
                style={{ width: '100%' }}
              />
            </Grid>
          );
        })}
      </Grid>
    </Fragment>
  );
};

export default DevicessConfig;
