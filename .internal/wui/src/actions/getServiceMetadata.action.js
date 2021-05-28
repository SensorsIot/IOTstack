import { getServiceMetadata } from '../services/configs'

const GET_CONFIG_SERVICE_METADATA = 'GET_CONFIG_SERVICE_METADATA';

const getServiceMetadataAction = (serviceName) => {
  return {
    type: GET_CONFIG_SERVICE_METADATA,
    promise: getServiceMetadata(serviceName),
    label: serviceName
  }
};

export {
  GET_CONFIG_SERVICE_METADATA,
  getServiceMetadataAction
};
