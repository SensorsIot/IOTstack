import { getAllServicesMetadata } from '../services/configs';

const GET_ALL_SERVICES_METADATA_ACTION = 'GET_ALL_SERVICES_METADATA_ACTION';

const getAllServicesMetadataAction = () => {
  return {
    type: GET_ALL_SERVICES_METADATA_ACTION,
    promise: getAllServicesMetadata()
  }
};

export {
  GET_ALL_SERVICES_METADATA_ACTION,
  getAllServicesMetadataAction
};
