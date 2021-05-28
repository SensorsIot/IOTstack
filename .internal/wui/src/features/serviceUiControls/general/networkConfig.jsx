import React, { Fragment, useState, useEffect } from 'react';
// import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Box from '@material-ui/core/Box';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';

const NetworkConfig = (props) => {
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
  const [networkMode, setNetworkMode] = useState(getBuildOptions()?.services?.[serviceName]?.networkMode ?? 'unchanged');

  const [modifiedNetworkList, setModifiedNetworkList] = useState({});
  useEffect(() => {
    const defaultOnNetworks = { ...getBuildOptions()?.services?.[serviceName]?.networks ?? {} };
    serviceTemplates[serviceName]?.networks?.forEach((networkName) => {
      defaultOnNetworks[networkName] = true;
    });
    setModifiedNetworkList({
      ...defaultOnNetworks
    });

    const toNetworkMode = getBuildOptions()?.services?.[serviceName]?.networkMode ?? 'unchanged';
    setNetworkMode(toNetworkMode);
  }, []);

  useEffect(() => {
    setTemporaryServiceOptions(serviceName, {
      ...getTemporaryBuildOptions()?.services?.[serviceName] ?? {},
      networks: modifiedNetworkList
    });
  }, [
    modifiedNetworkList
  ]);

  useEffect(() => {
    setTemporaryServiceOptions(serviceName, {
      ...getTemporaryBuildOptions()?.services?.[serviceName] ?? {},
      networkMode: networkMode
    });
  }, [
    networkMode
  ]);

  const onChangeCb = (event, changeType, networkName) => {
    if (changeType === 'mode') {
      const newMode = event.target.value;
      setNetworkMode(newMode);
      if (typeof(onChange) === 'function') {
        onChange(event, changeType);
      }
    } else if (changeType === 'network') {
      const networkSelected = event.target.checked;
      setModifiedNetworkList({
        ...modifiedNetworkList,
        [networkName]: networkSelected
      });
      if (typeof(onChange) === 'function') {
        onChange(networkName, networkSelected, changeType);
      }
    } else {
      
      if (typeof(onChange) === 'function') {
        onChange(event, changeType, networkName);
      }
    }
  };

  const defaultValue = (networkName) => {
    return (serviceTemplates[serviceName]?.networks ?? []).includes(networkName);
  };

  return (
    <Fragment>
      <Grid container spacing={3} justify="space-between">
        <Grid item>
          IOTstack Networks:
        </Grid>
        <Grid item>
          <Box m={-1} mr={1}>
            <Box m={1} display="inline">Mode:</Box>
            <Select
              labelId="network-mode-label"
              id="network-mode"
              value={networkMode}
              onChange={(evt) => onChangeCb(evt, 'mode')}
            >
              <MenuItem value={'unchanged'}>Unchanged{serviceTemplates[serviceName]?.network_mode ? ` (${serviceTemplates[serviceName]?.network_mode})` : ''}</MenuItem>
              <MenuItem value={'host'}>Host</MenuItem>
              <MenuItem value={'bridge'}>Bridge</MenuItem>
              <MenuItem value={'overlay'}>Overlay</MenuItem>
              <MenuItem value={'macvlan'}>MAC-VLAN</MenuItem>
              <MenuItem value={'none'}>No Networking</MenuItem>
            </Select>
          </Box>
        </Grid>
      </Grid>
      <Grid container spacing={3} justify="space-between">
        {(networkTemplateList?.payload ?? []).map((networkName) => {
          return (
            <Grid
              item
              xs={12}
              md={5}
              lg={4}
              xl={2}
              key={networkName}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={modifiedNetworkList?.[networkName] ?? defaultValue(networkName)}
                    onChange={(evt) => onChangeCb(evt, 'network', networkName) }
                    name={networkName}
                    color="primary"
                  />
                }
                label={networkName}
              />
            </Grid>
          );
        }).filter((ele) => {
          return ele !== null;
        })}
      </Grid>
    </Fragment>
  );
};

export default NetworkConfig;
