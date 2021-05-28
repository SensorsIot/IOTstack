import React, { Fragment, useState, useEffect } from 'react';
// import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import {
  getExternalVolume,
  getInternalVolume,
  replaceExternalVolume
} from '../../../utils/parsers';

const VolumesConfig = (props) => {

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
  const yamlVolumeSettings = serviceTemplates?.[serviceName]?.volumes || [];

  const [volumeSettings, setVolumeSettings] = useState(yamlVolumeSettings);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if ((getBuildOptions().services?.[serviceName]?.volumes?.length ?? 0) < 1 ) {
      setTemporaryServiceOptions(serviceName, {
        ...getBuildOptions().services?.[serviceName] ?? {},
        volumes: yamlVolumeSettings
      });
    } else {
      setVolumeSettings(getBuildOptions().services?.[serviceName]?.volumes);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      setTemporaryServiceOptions(serviceName, {
        ...tempBuildOptions?.services?.[serviceName] ?? {},
        volumes: volumeSettings
      });
    }
  }, [
    volumeSettings
  ]);

  const onChangeCb = (internalVolume, event) => {
    const newExternalVolumePath = event.target.value;
    const temporaryVolumes = [...volumeSettings];
    
    const volumeIndex = temporaryVolumes.findIndex((index) => {
      return getInternalVolume(index) === internalVolume;
    });
    
    if (volumeIndex > -1) {
      temporaryVolumes[volumeIndex] = replaceExternalVolume(temporaryVolumes[volumeIndex], newExternalVolumePath);
    }

    setVolumeSettings(temporaryVolumes);
    if (typeof(onChange) === 'function') {
      onChange(internalVolume, newExternalVolumePath);
    }
  };

  return (
    <Fragment>
      <Grid container spacing={4}>
        {volumeSettings.map((volume) => {
          const internalVolume = getInternalVolume(volume);
          const currentExternalVolume = getExternalVolume(volume);

          return (
            <Grid
              item
              xs={12}
              md={12}
              lg={6}
              xl={5}
              key={internalVolume}
            >
              <TextField
                id={`volumeConfig_${internalVolume}`}
                label={`Vol: ${internalVolume} ${currentExternalVolume === '' ? '(Deleted)' : ''}`}
                onChange={(event) => { onChangeCb(internalVolume, event) }}
                value={currentExternalVolume}
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
