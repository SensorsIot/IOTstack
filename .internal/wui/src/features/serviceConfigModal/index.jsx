import React, { Fragment, useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Modal from '@material-ui/core/Modal';
import Grid from '@material-ui/core/Grid';
import Button from "@material-ui/core/Button";
import Box from '@material-ui/core/Box';
import getConfigComponents from '../../utils/configOptionLoader';
import {
  deleteTemporaryBuildOptions
} from '../../utils/buildOptionSync';

const getModalStyle = () => {
  const top = 10;
  const left = 50;

  return {
    top: `${top}%`,
    left: `${left}%`,
    maxHeight: '75%',
    overflow: 'hidden',
    overflowY: 'scroll',
    transform: `translate(-50%, 0%)`,
  };
};

const useStyles = makeStyles((theme) => ({
  paper: {
    position: 'absolute',
    width: '50%',
    backgroundColor: theme.palette.background.paper,
    border: '2px solid #000',
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3),
  },
}));

const ServiceConfigModal = (props) => {
  const {
    isOpen,
    handleClose,
    serviceName,
    networkTemplateList,
    serviceMetadata,
    serviceConfigOptions,
    buildOptions,
    serviceTemplates,
    setBuildOptions,
    getBuildOptions,
    buildOptionsInit,
    setServiceOptions,
    setTemporaryBuildOptions,
    getTemporaryBuildOptions,
    setTemporaryServiceOptions,
    setupTemporaryBuildOptions,
    saveTemporaryBuildOptions
  } = props;

  const closeModal = (event) => {
    deleteTemporaryBuildOptions();
    if (typeof handleClose === 'function') {
      handleClose(event);
    }
  }

  const resetDefaults = (evt) => {
    const currentBuildOptions = getBuildOptions();
    delete currentBuildOptions?.services[serviceName];
    setBuildOptions(currentBuildOptions);
    closeModal(evt);
  };

  const classes = useStyles();
  const [modalStyle] = React.useState(getModalStyle);
  const body = (
    <div style={modalStyle} className={classes.paper}>
      <h2 id="simple-modal-title">{serviceMetadata ? serviceMetadata.displayName : ''} ({serviceName}) Configuration</h2>
      <Fragment>
        {getConfigComponents(serviceConfigOptions ?? []).map((ConfigComponent, index) => {
          return (
            <Box
              key={index}
              mt="2rem"
              mb="2rem"
              p={2}
              borderRadius="borderRadius"
              border={1}
              borderColor="grey.500"
            >
              <ConfigComponent
                networkTemplateList={networkTemplateList}
                setBuildOptions={setBuildOptions}
                setServiceOptions={setServiceOptions}
                getBuildOptions={getBuildOptions}
                buildOptionsInit={buildOptionsInit}
                setTemporaryBuildOptions={setTemporaryBuildOptions}
                getTemporaryBuildOptions={getTemporaryBuildOptions}
                setTemporaryServiceOptions={setTemporaryServiceOptions}
                setupTemporaryBuildOptions={setupTemporaryBuildOptions}
                saveTemporaryBuildOptions={saveTemporaryBuildOptions}
                serviceMetadata={serviceMetadata}
                serviceName={serviceName}
                serviceConfigOptions={serviceConfigOptions}
                serviceTemplates={serviceTemplates}
              />
            </Box>
          );
        })}
        <Box pt={"1rem"}>
          <Grid container item xs={12} spacing={3} >
            <Grid item xs={7} md={4}>
              <Button variant="contained" onClick={(evt) => { saveTemporaryBuildOptions(); closeModal(evt); }}>Save and Close</Button>
            </Grid>
            <Grid item xs={7} md={4}>
              <Button variant="contained" onClick={(evt) => { closeModal(evt); }}>Cancel and Close</Button>
            </Grid>
            {/* <Grid item xs={7} md={4}>
              <Button variant="contained" onClick={(evt) => { resetDefaults(evt); }}>Reset to Default</Button>
            </Grid> */}
          </Grid>
        </Box>
      </Fragment>
      <ServiceConfigModal />
    </div>
  );

  return (
    <Modal
      open={isOpen || false}
      onClose={closeModal}
      aria-labelledby="simple-modal-title"
      aria-describedby="simple-modal-description"
    >
      {body}
    </Modal>
  );
};

export default ServiceConfigModal;