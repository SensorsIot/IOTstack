import React, { Fragment, useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { useDispatch, useSelector } from "react-redux";
import Modal from '@material-ui/core/Modal';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Link from '@material-ui/core/Link';

import { byName } from '../../utils/interpolate';

import styles from './help-and-docs.module.css';

const getModalStyle = () => {
  const top = 35;
  const left = 50;

  return {
    top: `${top}%`,
    left: `${left}%`,
    transform: `translate(-50%, -${left}%)`,
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

const HelpAndDocsModal = (props) => {
  const {
    isOpen,
    handleClose,
    serviceDocs,
    serviceName,
    displayName
  } = props;

  const closeModal = (event) => {
    if (typeof handleClose === 'function') {
      handleClose(event);
    }
  }

  const classes = useStyles();
  const [modalStyle] = React.useState(getModalStyle);
  const body = (
    <div style={modalStyle} className={classes.paper}>
      <h2 id="simple-modal-title">{displayName} - ({serviceName}) Help and Docs</h2>
      <Grid
        container
        spacing={4}
      >
        {serviceDocs
        && typeof serviceDocs === 'object'
        && Object.keys(serviceDocs?.links ?? []).map((key, i) => {
          if (serviceDocs?.links[key]) {
            return (
              <Grid item display="flex" xs={7} md={5}>
                <Link
                  href={serviceDocs?.links?.[key]}
                  rel="noopener"
                  target="_blank"
                  className={styles.docsLink}
                >
                  <Box className={styles.docsInner}>
                    {byName(key, { displayName, serviceName })}
                  </Box>
                </Link>
              </Grid>
            )
          }
        })}
      </Grid>

      <Box pt={6}>
        <Grid container>
          <Grid item>
            <Button variant="contained" onClick={(evt) => { closeModal(evt); }}>Close</Button>
          </Grid>
        </Grid>
      </Box>
    </div>
  );
  
  return (
    <Fragment>
      <Modal
        open={isOpen}
        onClose={closeModal}
        aria-labelledby="simple-modal-title"
        aria-describedby="simple-modal-description"
      >
        {body}
      </Modal>
    </Fragment>
  );
};

export default HelpAndDocsModal;