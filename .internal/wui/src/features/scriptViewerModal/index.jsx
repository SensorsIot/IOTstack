import React, { Fragment, useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Modal from '@material-ui/core/Modal';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';
// import Box from '@material-ui/core/Box';
// import Tooltip from '@material-ui/core/Tooltip';
import Button from '@material-ui/core/Button';

const getModalStyle = () => {
  const top = 15;
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
    width: '70%',
    backgroundColor: theme.palette.background.paper,
    border: '2px solid #000',
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3),
  },
}));

const ScriptViewerModal = (props) => {
  const {
    isOpen,
    handleClose,
    displayScript,
    scriptTitle,
    readOnly,
    showActionButton,
    actionButtonText,
    actionButtonFunction
  } = props;
  const [renderedScript, setRenderedScript] = useState('Failed to load');

  useEffect(() => {
    setRenderedScript(displayScript);
  }, [displayScript]);

  const closeModal = (event) => {
    if (typeof handleClose === 'function') {
      handleClose(event);
    }
  }

  const classes = useStyles();
  const [modalStyle] = useState(getModalStyle);
  const body = (
    <div style={modalStyle} className={classes.paper}>
      <h2 id="script-viewer-modal-title">{scriptTitle ?? 'Viewing Script'}</h2>
      <Fragment>
        <Box p={2}>
          <TextField
            multiline
            fullWidth
            defaultValue={renderedScript}
            InputProps={
              {
                readOnly,
                style: { fontFamily: 'Monospace' }
              }
            }
            variant="outlined"
          />
        </Box>
      </Fragment>
      
      <Grid
        container
        spacing={4}
      >
        <Grid item
          display="flex"
        >
          <Button variant="contained" onClick={closeModal}>
            Close
          </Button>
        </Grid>
        {
          showActionButton
          && actionButtonText
          && typeof(actionButtonFunction) === 'function'
          && (
            <Grid item
              display="flex"
            >
              <Button variant="contained" onClick={() => actionButtonFunction(props)}>
                {actionButtonText}
              </Button>
            </Grid>
          )
        }
      </Grid>
      <ScriptViewerModal />
    </div>
  );
  
  return (
    <Modal
      open={isOpen}
      onClose={closeModal}
      aria-labelledby="script-viewer-modal-title"
      aria-describedby="script-viewer-modal-description"
    >
      {body}
    </Modal>
  );
};

export default ScriptViewerModal;