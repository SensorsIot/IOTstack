import React, { Fragment, useState, useEffect } from 'react';
// import { useDispatch, useSelector } from "react-redux";
import Box from '@material-ui/core/Box';
// import Tooltip from '@material-ui/core/Tooltip';
import Skeleton from '@material-ui/lab/Skeleton';
// import FormControlLabel from '@material-ui/core/FormControlLabel';
// import Checkbox from '@material-ui/core/Checkbox';
// import Button from '@material-ui/core/Button';
import Link from '@material-ui/core/Link';
import Button from '@material-ui/core/Button';
import { useDispatch, useSelector } from "react-redux";
// import ErrorOutlineOutlinedIcon from '@material-ui/icons/ErrorOutlineOutlined';
import { makeStyles } from '@material-ui/core/styles';
import { useTheme } from '@material-ui/core/styles';
import ScriptViewerModal from '../scriptViewerModal';
import { getBuildFileAction } from '../../actions/getBuildFile.action';
import { deleteBuildAction } from '../../actions/deleteBuild.action';
import {
  addSelectedService,
  clearAllSelectedServicesAction
} from '../../actions/updateSelectedServices.action';
import { setSelectedItems_services, setBuildOptions } from '../../utils/buildOptionSync';
import styles from './build-history-grid-item.module.css';

const useStyles = makeStyles({
  serviceCard: {
    "&:hover": {
      borderColor: ({ theme }) => theme.palette.text.primary
    }
  }
});

const mapDispatchToProps = (dispatch) => {
  return {
    dispatchGetBuildFile: ({ build, type, label }) => dispatch(getBuildFileAction({ build, type, label })),
    dispatchAddSelectedService: (serviceName) => dispatch(addSelectedService(serviceName)),
    dispatchClearAllSelectedServices: () => dispatch(clearAllSelectedServicesAction()),
    dispatchDeleteBuild: ({ build }) => dispatch(deleteBuildAction({ build }))
  };
};

const mapStateToProps = (selector) => {
  return {
    buildFiles: selector(state => state.buildFiles)
  };
};

const ServiceItem = (props) => {
  const theme = useTheme();
  const classes = useStyles({ props, theme });

  props = {
    ...props,
    ...mapDispatchToProps(useDispatch()),
    ...mapStateToProps(useSelector)
  };
  const {
    dispatchAddSelectedService,
    dispatchClearAllSelectedServices,
    dispatchGetBuildFile,
    dispatchDeleteBuild,
    buildTime,
    dispatchDownloadBuildFile,
    downloadLinkRef,
    buildFiles
  } = props;

  const [scriptViewerModalOpen, setScriptViewerModalOpen] = useState(false);
  const [loadableScriptOptions, setLoadableScriptOptions] = useState(false);
  const [displayScript, setDisplayScript] = useState('Loading...');

  useEffect(() => {
    const downloadedScript = buildFiles?.files?.completed?.[buildTime]?.payload;
    if (downloadedScript) {
      setDisplayScript(downloadedScript);
      setScriptViewerModalOpen(true);
    }
  }, [buildFiles?.files?.completed?.[buildTime]?.status]);

  let isLoading = false;
  let buildHistoryError = {
    hasError: false
  };

  const loadBuild = (modalProps) => {
    const buildConfig = JSON.parse(modalProps.displayScript);
  
    setSelectedItems_services(buildConfig.selectedServices);
    setBuildOptions(buildConfig.configurations);
    dispatchClearAllSelectedServices();
    buildConfig?.selectedServices?.map((service) => {
      dispatchAddSelectedService(service);
    });

    setScriptViewerModalOpen(false);
  };
  
  const buildHistoryComponent = () => {
    return (
      <Box
        p={1}
        m={1}
        justifyContent="center"
      >
        <Box display="flex" p={1} justifyContent="center" fontSize="2rem">{buildTime}</Box>
        <Box display="flex" p={1} pb={2} justifyContent="center">
          <Link
            href="#"
            onClick={() => {
              return dispatchDownloadBuildFile({ build: buildTime, type: 'zip', linkRef: downloadLinkRef });
            }}
            rel="noopener"
            target="_blank"
            className={styles.docsLink}
            color="inherit"
          >
            Download Zip
          </Link>
        </Box>
        <Box display="flex" p={2} justifyContent="center" flexWrap="wrap">
          <Button
            variant="contained"
            className={styles.docsLink}
            style={{ textTransform: 'none' }}
            color="inherit"
            onClick={() => {
              setLoadableScriptOptions(true);
              return dispatchGetBuildFile({ build: buildTime, type: 'json', label: buildTime });
              // return setScriptViewerModalOpen(true);
            }}
          >
            Load this build
          </Button>
        </Box>
        <Box display="flex" p={2} justifyContent="center" flexWrap="wrap">
          <Button
            variant="contained"
            className={styles.docsLink}
            style={{ textTransform: 'none' }}
            color="inherit"
            onClick={() => {
              setLoadableScriptOptions(false);
              return dispatchGetBuildFile({ build: buildTime, type: 'yaml', label: buildTime });
              // return setScriptViewerModalOpen(true);
            }}
          >
            View docker-compose.yml
          </Button>
        </Box>
        <Box display="flex" p={2} justifyContent="center">
          <Button
            variant="contained"
            className={styles.docsLink}
            style={{ textTransform: 'none' }}
            color="inherit"
            onClick={() => {
              return dispatchDeleteBuild({ build: buildTime });
            }}
          >
            Delete Build
          </Button>
        </Box>
      </Box>
    )
  };

  const errorComponent = () => {
    return (
      <Fragment>
        <div>Error loading: {buildTime}</div>
        <div>Try refreshing, and ensuring the API server is running correctly.</div>
      </Fragment>
    )
  };

  const loadingComponent = () => {
    return (
      <Fragment>
        Loading '{buildTime}' details...
        <Box display="flex" justifyContent="center">
          <Skeleton height={'6rem'} width={'80%'} variant="text" />
        </Box>
        <Box display="flex" justifyContent="center" m={1} p={1} >
          <Skeleton variant="circle" width={120} height={120} />
        </Box>
        <Box display="flex" justifyContent="center">
          <Skeleton height={'3rem'} width={'70%'} variant="text" />
        </Box>
        <Box display="flex" justifyContent="center">
          <Skeleton height={'4rem'} width={'90%'} variant="text" />
        </Box>
      </Fragment>
    )
  };

  return (
    <Fragment>
      <ScriptViewerModal
        isOpen={scriptViewerModalOpen}
        handleClose={() => setScriptViewerModalOpen(false)}
        displayScript={displayScript}
        scriptTitle={`docker-compose.yml for build: '${buildTime}'`}
        showActionButton={loadableScriptOptions}
        actionButtonText={'Load build'}
        actionButtonFunction={loadBuild}
      />
      <Box
        className={`${styles.serviceCard} ${classes.serviceCard}`}
        borderRadius="borderRadius"
        borderColor="primary.main"
        bgcolor="background.paper"
        margin={1}
        border={1}
      >
        {isLoading
        && (loadingComponent())}
        {!isLoading
        && buildTime
        && (
          buildHistoryComponent()
        )}
        {!isLoading
        && buildHistoryError.hasError === true
        && (
          errorComponent()
        )}
      </Box>
    </Fragment>
  );
};

export default ServiceItem;
