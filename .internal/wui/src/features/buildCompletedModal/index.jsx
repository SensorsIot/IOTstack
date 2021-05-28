import React, { Fragment, useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { useDispatch, useSelector } from "react-redux";
import Modal from '@material-ui/core/Modal';
// import Box from '@material-ui/core/Box';
// import Tooltip from '@material-ui/core/Tooltip';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import ScriptViewerModal from '../scriptViewerModal';

import { getBuildFileAction } from '../../actions/getBuildFile.action';

const getModalStyle = () => {
  const top = 15;
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

const mapDispatchToProps = (dispatch) => {
  return {
    dispatchGetBuildFile: ({ build, type, label }) => dispatch(getBuildFileAction({ build, type, label }))
  };
};

const mapStateToProps = (selector) => {
  return {
    buildFiles: selector(state => state.buildFiles)
  };
};

const BuildCompletedModal = (props) => {
  props = {
    ...props,
    ...mapDispatchToProps(useDispatch()),
    ...mapStateToProps(useSelector)
  };

  const {
    isOpen,
    handleClose,
    buildStack,
    scriptTemplates,
    dispatchGetScriptTemplates,
    dispatchGetBuildFile,
    dispatchDownloadBuildFile,
    downloadLinkRef,
    buildFiles
  } = props;

  const [scriptViewerModalOpen, setScriptViewerModalOpen] = useState(false);
  const [displayScript, setDisplayScript] = useState('Loading...');
  const [showBootstrapScript, setShowBootstrapScript] = useState(false);

  // const { build, files, issues } = buildStack?.payload ?? {};
  const { build } = buildStack?.payload ?? {};

  useEffect(() => {
    const downloadedScript = buildFiles?.files?.completed?.[build]?.payload;
    if (downloadedScript) {
      setDisplayScript(downloadedScript);
      setScriptViewerModalOpen(true);
    }
  }, [buildFiles?.files?.completed?.[build]?.status]);

  const bootstrapBody = () => {
    if ((typeof scriptTemplates?.scripts?.completed?.bootstrap?.payload ?? null) === 'string') {
      return scriptTemplates.scripts.completed.bootstrap?.payload;
    }
    return '';
  };

  const closeModal = (event) => {
    setShowBootstrapScript(false);
    if (typeof handleClose === 'function') {
      handleClose(event);
    }
  }

  // const linkRef = React.createRef();
  const classes = useStyles();
  const [modalStyle] = React.useState(getModalStyle);
  const body = (
    <div style={modalStyle} className={classes.paper}>
      <h2 id="simple-modal-title">Build {build} Complete</h2>
      <p id="simple-modal-description">
        Choose from the following options:
      </p>
      <Grid
        container
        spacing={4}
      >
        <Grid item
          display="flex"
        >
          <Button variant="contained" onClick={() => {
            return dispatchDownloadBuildFile({ build, type: 'zip', linkRef: downloadLinkRef });
          }}>Download build zip file</Button>
        </Grid>
        <Grid item
          display="flex"
        >
          <Button variant="contained" onClick={() => {
            dispatchGetScriptTemplates({ scriptName: 'bootstrap', options: { build } })
            setShowBootstrapScript(!showBootstrapScript);
          }}>Show bootstrap script installer</Button>
        </Grid>
        <Grid item
          display="flex"
        >
          <Button variant="contained" onClick={() => {
            return dispatchGetBuildFile({ build, type: 'yaml', label: build });
          }}>Show docker-compose.yml file</Button>
        </Grid>
      </Grid>
      <Fragment>
        {showBootstrapScript
        && (
          <Fragment>
            <pre>{bootstrapBody()}</pre>
          </Fragment>
        )}
      </Fragment>
      <BuildCompletedModal />
    </div>
  );
  
  return (
    <Fragment>
      <ScriptViewerModal
        isOpen={scriptViewerModalOpen}
        handleClose={() => setScriptViewerModalOpen(false)}
        displayScript={displayScript}
        scriptTitle={`docker-compose.yml for build: '${build}'`}
        showActionButton={false}
        actionButtonText={'Load build'}
        actionButtonFunction={() => {}}
      />
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

export default BuildCompletedModal;