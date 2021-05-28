// import React, { Fragment, useState, useEffect } from 'react';
import React, { Fragment, useEffect } from 'react';
import { useDispatch, useSelector } from "react-redux";
import Grid from '@material-ui/core/Grid';
import BuildHistoryGridItem from '../../features/buildHistoryGridItem'
import {
  getBuildHistoryListAction
} from '../../actions/getBuildHistoryList.action';

import {
  clearBuildStateAction
} from '../../actions/buildStack.action';

import {
  downloadBuildFile
} from '../../actions/downloadBuild.action';

const mapDispatchToProps = (dispatch) => {
  return {
    dispatchGetBuildHistoryList: () => dispatch(getBuildHistoryListAction()),
    dispatchClearBuildState: () => dispatch(clearBuildStateAction()),
    dispatchDownloadBuildFile: ({ build, type, linkRef }) => dispatch(downloadBuildFile({ build, type, linkRef }))
  };
};

const mapStateToProps = (selector) => {
  return {
    buildHistory: selector(state => state.buildHistory),
    deleteBuild: selector(state => state.deleteBuild)
  };
};

const Main = (props) => {
  const downloadLinkRef = React.useRef(null);
  props = {
    ...props,
    ...mapDispatchToProps(useDispatch()),
    ...mapStateToProps(useSelector)
  };

  const {
    dispatchGetBuildHistoryList,
    dispatchClearBuildState,
    dispatchDownloadBuildFile,
    buildHistory,
    deleteBuild
  } = props;

  useEffect(() => {
    dispatchGetBuildHistoryList();
    dispatchClearBuildState();
  }, []);

  useEffect(() => {
    dispatchGetBuildHistoryList();
  }, [deleteBuild]);

  return (
    <Fragment>
      <a ref={downloadLinkRef} />
      <div className="BuildHistoryPage">
        <Grid
          container
          spacing={4}
          justify="center"
        >
          {typeof buildHistory.payload !== 'undefined' && Object.keys(buildHistory.payload.buildsList).map((buildDetailsTime) => {
            return (
              <Grid item
                key={buildDetailsTime}
                display="flex"
              >
                <BuildHistoryGridItem
                  dispatchDownloadBuildFile={dispatchDownloadBuildFile}
                  downloadLinkRef={downloadLinkRef}
                  buildTime={buildDetailsTime}
                  buildDetails={buildHistory.payload.buildsList[buildDetailsTime]}
                />
              </Grid>
            );
          })}
        </Grid>
      </div>
    </Fragment>
  );
}

export default Main;
