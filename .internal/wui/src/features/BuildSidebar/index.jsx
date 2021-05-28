import React, { Fragment, useState, useEffect } from 'react';
import { useDispatch, useSelector } from "react-redux";
import Box from '@material-ui/core/Box';
// import Tooltip from '@material-ui/core/Tooltip';
import Button from '@material-ui/core/Button';
// import ErrorOutlineOutlinedIcon from '@material-ui/icons/ErrorOutlineOutlined';
import Divider from '@material-ui/core/Divider';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
// import { makeStyles, useTheme } from '@material-ui/core/styles';
import styles from './build-sidebar.module.css';
import {
  addTagToHideListAction,
  removeTagFromHideListAction
} from '../../actions/updateFilterTags.action';
import {
  createAndBuildStackAction
} from '../../actions/buildStack.action';
import {
  getScriptFromTemplateAction
} from '../../actions/getScript.action';
import {
  downloadBuildFile
} from '../../actions/downloadBuild.action';
import BuildCompletedModal from '../buildCompletedModal';
import { API_STATUS } from '../../constants';
import { getBuildOptions } from '../../utils/buildOptionSync';

// const useStyles = makeStyles({
//   serviceCard: {
//     "&:hover": {
//       borderColor: ({ theme }) => theme.palette.text.primary
//     }
//   }
// });

const getUniqueTagsFromTemplates = ({ serviceTemplateListPayload, metadataList }) => {
  const tagList = [];
  if (Array.isArray(serviceTemplateListPayload)) {
    serviceTemplateListPayload.forEach((service) => {
      if (Array.isArray(metadataList?.[service]?.serviceTypeTags ?? false)) {
        metadataList[service].serviceTypeTags.forEach((tag) => {
          if (!tagList.includes(tag)) {
            tagList.push(tag);
          }
        });
      }
    });
  }
  tagList.sort();
  return tagList;
};

const buildIssueListItem = (name, issueType, issueText) => {
  return (
    <Box><strong>{name} [{issueType}]</strong> - {issueText}</Box>
  );
};

const buildIssuesRender = (issues) => {
  const unknownError = !(
    issues.payload
    && issues.payload.issueList
    && Array.isArray(issues.payload.issueList.services)
    && Array.isArray(issues.payload.issueList.networks)
    && Array.isArray(issues.payload.issueList.other)
  );

  const noIssues = (
    !unknownError
    && issues.payload.issueList.services.length === 0
    && issues.payload.issueList.networks.length === 0
    && issues.payload.issueList.other.length === 0
  );

  return (
    <Box className={styles.section}>
      Build Issues:
      <Box>
        {issues.status === API_STATUS.SUCCESS
        && (
          <Fragment>
            {Array.isArray(issues?.payload?.issueList?.services)
            && (issues?.payload?.issueList?.services?.length ?? 0) > 0
            && (
              <Box paddingTop={2}>
                <Box>
                  Services:
                  <Box>
                    <ul>
                      {issues.payload.issueList.services.map((issue) => {
                        return (
                          <li key={`${issue.issueType}${issue.name}${issue.message}`}>
                            {buildIssueListItem(issue.name, issue.issueType, issue.message)}
                          </li>
                        )
                      })}
                    </ul>
                  </Box>
                </Box>
              </Box>
            )}
            {Array.isArray(issues?.payload?.issueList?.networks)
            && (issues?.payload?.issueList?.networks?.length ?? 0) > 0
            && (
              <Box paddingTop={2}>
                <Box>
                  Networks:
                  <Box>
                    <ul>
                      {(issues?.payload?.issueList?.networks ?? []).map((issue) => {
                        return (
                          <li key={`${issue.issueType}${issue.name}${issue.message}`}>
                            {buildIssueListItem(issue.name, issue.issueType, issue.message)}
                          </li>
                        )
                      })}
                    </ul>
                  </Box>
                </Box>
              </Box>
            )}
            {Array.isArray(issues?.payload?.issueList?.other)
            && (issues?.payload?.issueList?.other?.length ?? 0) > 0
            && (
              <Box paddingTop={2}>
                <Box>
                  Other Issues:
                  <Box>
                    <ul>
                      {issues.payload.issueList.other.map((issue) => {
                        return (
                          <li key={`${issue.issueType}${issue.name}${issue.message}`}>
                            {buildIssueListItem(issue.name, issue.issueType, issue.message)}
                          </li>
                        )
                      })}
                    </ul>
                  </Box>
                </Box>
              </Box>
            )}
            {noIssues
            && (
              <Box paddingTop={2}>
                <Box>
                  No build issues
                </Box>
              </Box>
            )}
            {!noIssues
            && (
              <Box paddingTop={2}>
                <Box>
                  You can still attempt to build when issues are reported.
                </Box>
              </Box>
            )}
            {unknownError
            && (
              <Box paddingTop={2}>
                <Box>
                  An unknown error occured retrieving build issues
                </Box>
              </Box>
            )}
          </Fragment>
        )}
        {issues.status === API_STATUS.PENDING
        && (
          <Fragment>Loading...</Fragment>
        )}
        {issues.status === API_STATUS.FAILURE
        && (
          <Fragment>Failed to get build issues from API</Fragment>
        )}
        {issues.status === API_STATUS.UNINIT
        && (
          <Fragment>No changes detected</Fragment>
        )}
      </Box>
    </Box>
  );
};

const buildList = (selectedServices) => {
  return (
    <Box className={styles.section}>
      Building Services:
      <Box>
        {selectedServices.join(', ')}
      </Box>
    </Box>
  );
};

const buildServices = (dispatchBuildStack, buildStack) => {
  return (
    <Box className={styles.section}>
      Build:
      <Box>
        <Button variant="contained" onClick={dispatchBuildStack}>Build</Button>
      </Box>
      {(buildStack?.status === API_STATUS.FAILURE ?? false)
      && (
        <Fragment>
          <Box>Error occured when building. Please check API logs.</Box>
          <Box>{buildStack?.error?.message ?? 'Unknown error'}</Box>
        </Fragment>
      )}
    </Box>
  );
};

const Sidebar = (props) => {
  // const theme = useTheme();
  // const classes = useStyles({ props, theme });

  const mapStateToProps = (selector) => {
    return {
      configServiceMetadata: selector(state => state.configServiceMetadata),
      hideServiceTags: selector(state => state.hideServiceTags),
      selectedServices: selector(state => state.selectedServices),
      buildIssues: selector(state => state.buildIssues),
      buildStack: selector(state => state.buildStack),
      scriptTemplates: selector(state => state.scriptTemplates),
      allServicesMetadataReducer: selector(state => state.allServicesMetadataReducer)
    };
  };
  const mapDispatchToProps = (dispatch) => {
    return {
      dispatchAddTagToHideList: (tag) => dispatch(addTagToHideListAction(tag)),
      dispatchRemoveTagFromHideList: (tag) => dispatch(removeTagFromHideListAction(tag)),
      dispatchBuildStack: (selectedServices, configurations) => dispatch(createAndBuildStackAction(selectedServices, configurations)),
      dispatchGetScriptTemplates: ({ scriptName, options, linkRef }) => dispatch(getScriptFromTemplateAction({ scriptName, options, linkRef })),
      dispatchDownloadBuildFile: ({ build, type, linkRef }) => dispatch(downloadBuildFile({ build, type, linkRef }))
    };
  };
  
  props = {
    ...props,
    ...mapStateToProps(useSelector),
    ...mapDispatchToProps(useDispatch()),
  };

  const [modalOpen, setModalOpen] = useState(false);
  useEffect(() => {
    if (props.buildStack.status === API_STATUS.SUCCESS) {
      setModalOpen(true);
    }
  }, [
    props.buildStack
  ]);

  const {
    serviceTemplateList,
    allServicesMetadataReducer,
    selectedServices,
    buildIssues,
    hideServiceTags,
    dispatchRemoveTagFromHideList,
    dispatchAddTagToHideList,
    dispatchBuildStack,
    dispatchGetScriptTemplates,
    dispatchDownloadBuildFile,
    buildStack,
    scriptTemplates
  } = props;

  const downloadLinkRef = React.useRef(null);

  const handleBuildSelectChange = (evt, tagName) => {
    if (evt.target.checked) {
      return dispatchAddTagToHideList(tagName);
    }
    return dispatchRemoveTagFromHideList(tagName);
  };

  const serviceFilter = (serviceTemplateListPayload, servicesMetadata) => {
    return (
      <Box className={styles.section}>
        Hide by tag:
        <Box>
          {
            getUniqueTagsFromTemplates({ serviceTemplateListPayload, metadataList: servicesMetadata }).map((tag) => {
              return (
                <FormControlLabel
                key={tag}
                control={
                  <Checkbox
                    checked={hideServiceTags.hideServiceTags.indexOf(tag) > -1}
                    onChange={(evt) => handleBuildSelectChange(evt, tag)}
                    name="checkedB"
                    color="primary"
                  />
                }
                label={tag}
              />
              );
            })
          }
        </Box>
      </Box>
    );
  };
  
  return (
    <Fragment>
      <a ref={downloadLinkRef} />
      <BuildCompletedModal
        isOpen={modalOpen}
        handleClose={() => setModalOpen(false)}
        buildStack={buildStack}
        scriptTemplates={scriptTemplates}
        dispatchGetScriptTemplates={dispatchGetScriptTemplates}
        dispatchDownloadBuildFile={dispatchDownloadBuildFile}
        downloadLinkRef={downloadLinkRef}
      />
      <Box
        py="2rem"
        border={1}
        className={`${styles.sidebarWrapper}`}
      >
        {serviceFilter(serviceTemplateList.payload, allServicesMetadataReducer.payload)}
        <Divider />
        {buildIssuesRender(buildIssues)}
        <Divider />
        {buildList(selectedServices.selectedServices)}
        <Divider />
        {buildServices(() => {
          if (Array.isArray(selectedServices.selectedServices) && selectedServices.selectedServices.length > 0) {
            dispatchBuildStack(selectedServices.selectedServices, getBuildOptions());
          }
        }, buildStack)}
      </Box>
    </Fragment>
  );
};

export default Sidebar;
