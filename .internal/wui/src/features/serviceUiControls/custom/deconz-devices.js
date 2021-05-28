import React, { Fragment, useState, useEffect } from 'react';
// import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Box from '@material-ui/core/Box';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';

const deconzDeviceList = [ // TODO: look into moving this to the API.
  {
    key: '/dev/ttyUSB0',
    value: '/dev/ttyUSB0'
  },
  {
    key: '/dev/ttyACM0',
    value: '/dev/ttyACM0'
  },
  {
    key: '/dev/ttyAMA0',
    value: '/dev/ttyAMA0'
  },
  {
    key: '/dev/ttyS0',
    value: '/dev/ttyS0'
  },
  {
    key: 'None',
    value: 'none'
  }
];

const DeconzDevices = (props) => {
  const {
    // serviceConfigOptions,
    serviceName,
    // setBuildOptions,
    getBuildOptions,
    // buildOptionsInit,
    // setServiceOptions,
    networkTemplateList,
    // setTemporaryBuildOptions,
    getTemporaryBuildOptions,
    setTemporaryServiceOptions,
    // setupTemporaryBuildOptions,
    // saveTemporaryBuildOptions,
    serviceTemplates,
    onChange
  } = props;

  // const tempBuildOptions = getTemporaryBuildOptions();
  const [selectedDevice, setSelectedDevice] = useState('none');

  useEffect(() => {
    const savedSelectedDevice = getBuildOptions()?.services?.[serviceName]?.selectedDevice ?? 'none';
    setSelectedDevice(savedSelectedDevice);
  }, []);

  useEffect(() => {
    setTemporaryServiceOptions(serviceName, {
      ...getTemporaryBuildOptions()?.services?.[serviceName] ?? {},
      selectedDevice: selectedDevice
    });
  }, [
    selectedDevice
  ]);

  const onChangeCb = (event) => {
    const newDevice = event.target.value;
    setSelectedDevice(newDevice);
    if (typeof(onChange) === 'function') {
      onChange(event);
    }
  };

  return (
    <Fragment>
      <Box>
        Deconz Hardware:
      </Box>
      <Grid container spacing={3} justify="space-between">
        <Grid item>
          <Box m={1} mr={1}>
            <Box m={1} display="inline">Select Device:</Box>
            <Select
              labelId="deconz-hw-select-label"
              id="deconz-hw-select"
              value={selectedDevice}
              onChange={(evt) => onChangeCb(evt)}
            >
              {deconzDeviceList.map((deconzDevice) => {
                return (
                  <MenuItem key={deconzDevice.key} value={deconzDevice.value}>{deconzDevice.key}</MenuItem>
                );
              })}
            </Select>
          </Box>
        </Grid>
      </Grid>
    </Fragment>
  );
};

export default DeconzDevices;
