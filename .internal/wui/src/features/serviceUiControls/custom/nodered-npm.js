import React, { Fragment, useState, useEffect } from 'react';
// import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Box from '@material-ui/core/Box';
import Divider from '@material-ui/core/Divider';
import Button from '@material-ui/core/Button';
import Link from '@material-ui/core/Link';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';

const NodeRedNpm = (props) => {
  const {
    serviceConfigOptions,
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

  const [selectedModules, setSelectedModules] = useState([]);
  const [showNonEssential, setShowNonEssential] = useState(false);
  const addons = serviceConfigOptions?.nodered_npmSelection ?? {};

  useEffect(() => {
    const savedSelectedModules = getBuildOptions()?.services?.[serviceName]?.addonsList ?? false;
    const defaultSelectedModules = addons?.defaultOn ?? [];
    const useSelectedModules = Array.isArray(savedSelectedModules) ? savedSelectedModules : defaultSelectedModules;
    setSelectedModules(useSelectedModules);
  }, []);

  useEffect(() => {
    setTemporaryServiceOptions(serviceName, {
      ...getTemporaryBuildOptions()?.services?.[serviceName] ?? {},
      addonsList: selectedModules
    });
  }, [
    selectedModules
  ]);

  const onChangeCb = (event, moduleName) => {
    const indexOfModule = selectedModules.indexOf(moduleName);
    const newModulesList = [...selectedModules];

    if (indexOfModule > -1) {
      newModulesList.splice(indexOfModule, 1);
    } else {
      newModulesList.push(moduleName);
    }

    setSelectedModules(newModulesList);
    if (typeof(onChange) === 'function') {
      onChange(event, moduleName);
    }
  };

  const sortAddons = ({ defaultOn, defaultOff, essentials }) => {
    const combinedList = [
      ...defaultOn,
      ...defaultOff
    ];
    combinedList.sort();

    const essentialsList = [];
    const nonEssentialList = [];

    combinedList.forEach((moduleName) => {
      if (essentials.includes(moduleName)) {
        essentialsList.push(moduleName);
      } else {
        nonEssentialList.push(moduleName);
      }
    });
    return { combinedList, essentialsList, nonEssentialList };
  };

  return (
    <Fragment>
      <Box>
        Initial NodeRed Plugins:
      </Box>
      <Box>
        Note: After starting NodeRed, you must make any modules changes with <Link href="https://nodered.org/docs/user-guide/editor/palette/manager" target="_blank">NodeRed's Pallete Menu</Link>.
      </Box>
      
      <Box m={1}>
        <Grid container spacing={1} justify="space-evenly">
              {sortAddons({ ...addons }).essentialsList.map((npmName) => {
                return (
                  <Grid
                    item
                    xs={6}
                    md={6}
                    lg={4}
                    xl={4}
                    key={npmName}
                  >
                    <Box mt={1}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedModules.includes(npmName)}
                            onChange={(evt) => onChangeCb(evt, npmName) }
                            name={npmName}
                            color="primary"
                          />
                        }
                        label={npmName}
                      />
                    </Box>
                  </Grid>
                )
              })}
        </Grid>
        {showNonEssential
        && (
            <Fragment>
              <Box p={4}>
                <Divider />
              </Box>
              <Grid container spacing={1} justify="space-evenly">
                {sortAddons({ ...addons }).nonEssentialList.map((npmName) => {
                  return (
                    <Grid
                      item
                      xs={6}
                      md={6}
                      lg={4}
                      xl={4}
                      key={npmName}
                    >
                      <Box mt={1}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={selectedModules.includes(npmName)}
                              onChange={(evt) => onChangeCb(evt, npmName) }
                              name={npmName}
                              color="primary"
                            />
                          }
                          label={npmName}
                        />
                      </Box>
                    </Grid>
                  )
                })}
              </Grid>
            </Fragment>
        )}
        <Box p={2} pt={4}>
          <Button variant="contained" onClick={() => {
            return setShowNonEssential(!showNonEssential);
          }}>{showNonEssential ? 'Hide' : 'Show'} Non-essential npm modules</Button>
        </Box>
      </Box>
    </Fragment>
  );
};

export default NodeRedNpm;
