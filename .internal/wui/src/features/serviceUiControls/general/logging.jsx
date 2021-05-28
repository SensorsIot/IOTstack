import React, { Fragment, useState, useEffect } from 'react';
// import Box from '@material-ui/core/Box';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Box from '@material-ui/core/Box';

const PortConfig = (props) => {

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
    // serviceTemplates,
    onChange
  } = props;

  // const tempBuildOptions = getTemporaryBuildOptions();

  const [loggingEnabled, setLoggingEnabled] = useState(getBuildOptions()?.services?.[serviceName]?.loggingEnabled ?? true);
  useEffect(() => {
    setTemporaryServiceOptions(serviceName, {
      ...getTemporaryBuildOptions()?.services?.[serviceName] ?? {},
      loggingEnabled
    });
  }, [
    loggingEnabled
  ]);

  const onChangeCb = (event) => {
    const newSetting = event.target.checked;
    setLoggingEnabled(newSetting);
    if (typeof(onChange) === 'function') {
      onChange(newSetting);
    }
  };

  return (
    <Fragment>
      <Box>
        <FormControlLabel
          control={
            <Checkbox
              checked={loggingEnabled}
              onChange={(evt) => onChangeCb(evt) }
              name={"logging"}
              color="primary"
            />
          }
          label={`Enable Logging for ${serviceName}`}
        />
      </Box>
    </Fragment>
  );
};

export default PortConfig;
