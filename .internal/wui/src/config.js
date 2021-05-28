const config = {
  apiUrl: window?.location?.hostname ?? '[::1]',
  apiPort: '32128',
  apiProtocol: `${window?.location?.protocol}//` ?? 'http://'
};

export default config;
