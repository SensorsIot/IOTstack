import React, { Fragment, useState, useEffect } from 'react';
// import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import {
  getExternalPort,
  replaceExternalPort,
  getInternalPort
} from '../../../utils/parsers';

const PortConfig = (props) => {

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

  const [portSettings, setPortSettings] = useState(getBuildOptions()?.services?.[serviceName]?.ports || {});
  useEffect(() => {
    setTemporaryServiceOptions(serviceName, {
      ...getTemporaryBuildOptions()?.services?.[serviceName] ?? {},
      ports: portSettings
    });
  }, [
    portSettings
  ]);

  const onChangeCb = (portKey, portLabelValue, event) => {
    const newPort = event.target.value;
    // const defaultTemplatePort = defaultValue(portKey, portKey);
    setPortSettings({
      ...portSettings,
      [portKey]: replaceExternalPort((portSettings[portKey] || portKey), newPort)
    });
    if (typeof(onChange) === 'function') {
      onChange(portKey, portLabelValue, newPort);
    }
  };

  const defaultValue = (portValueKey, defaultValue) => {
    const servicePorts = tempBuildOptions?.services?.[serviceName] ?? {};
    return servicePorts?.ports?.[portValueKey] ?? defaultValue;
  };

  return (
    <Fragment>
      <Grid container spacing={3}>
        {serviceConfigOptions && Object.keys(serviceConfigOptions.labeledPorts).map((portValueKey) => {
          const currentPortSetting = portSettings[portValueKey] || defaultValue(portValueKey, portValueKey);
          if ((serviceTemplates[serviceName]?.ports?.[portValueKey] ?? []).indexOf(portValueKey)) { // Only show ports that exist in the YAML template
            return (
              <Grid
                item
                xs={12}
                md={6}
                lg={3}
                key={serviceConfigOptions.labeledPorts[portValueKey]}
              >
                <TextField
                  id={`portConfig_${serviceConfigOptions.labeledPorts[portValueKey]}`}
                  label={`Port: ${serviceConfigOptions.labeledPorts[portValueKey]} (${getInternalPort(defaultValue(portValueKey, portValueKey))})`}
                  onChange={(event) => { onChangeCb(portValueKey, serviceConfigOptions.labeledPorts[portValueKey], event) }}
                  value={getExternalPort(currentPortSetting)}
                />
              </Grid>
            );
          }

          return null;
        }).filter((ele) => {
          return ele !== null;
        })}
      </Grid>
    </Fragment>
  );
};

export default PortConfig;
