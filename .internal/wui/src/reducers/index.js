import { configureStore } from '@reduxjs/toolkit';
import thunk from 'redux-thunk';
import promiseMiddleware from './middlewares/promiseMiddleware';
import asyncDispatchMiddleware from './middlewares/asyncDispatchMiddleware';
import counterReducer from './counter';
import serviceTemplateList from './getServiceTemplateListReducer';
import serviceTemplates from './getServiceTemplatesReducer';
import networkTemplateList from './getNetworkTemplateListReducer';
import configServiceMetadata from './getServiceMetadataReducer';
import allServicesMetadataReducer from './getAllServicesMetadataReducer';
import configServiceConfigOptions from './getServiceConfigOptionsReducer';
import allServicesConfigOptionsReducer from './getAllServicesConfigOptionsReducer';
import allServicesConfigHelpReducer from './getAllServicesConfigHelpReducer';
import selectedServices from './updateSelectedServicesReducer';
import hideServiceTags from './updateSelectedFilterTagsReducer';
import buildIssues from './getBuildIssuesReducer';
import buildStack from './buildStackReducer';
import buildHistory from './getBuildHistoryListReducer';
import scriptTemplates from './getScriptTemplatesReducer';
import buildFiles from './getBuildFileReducer';
import deleteBuild from './getDeleteBuildReducer';


const middlewares = [thunk, promiseMiddleware, asyncDispatchMiddleware];

export default configureStore({
  reducer: {
    counter: counterReducer,
    serviceTemplateList: serviceTemplateList,
    networkTemplateList: networkTemplateList,
    serviceTemplates: serviceTemplates,
    configServiceMetadata: configServiceMetadata,
    allServicesMetadataReducer: allServicesMetadataReducer,
    configServiceConfigOptions: configServiceConfigOptions,
    allServicesConfigOptionsReducer: allServicesConfigOptionsReducer,
    allServicesConfigHelpReducer: allServicesConfigHelpReducer,
    selectedServices: selectedServices,
    buildHistory: buildHistory,
    hideServiceTags: hideServiceTags,
    buildIssues: buildIssues,
    buildStack: buildStack,
    scriptTemplates: scriptTemplates,
    buildFiles: buildFiles,
    deleteBuild: deleteBuild
  },
  middleware: middlewares
});
