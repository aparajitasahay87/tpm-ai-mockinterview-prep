// shared-lib/logger.js

const timestamp = () => {
    return new Date().toISOString();
  };
  
  const info = (message) => {
    console.log(`${timestamp()} [INFO] ${message}`);
  };
  
  const warn = (message) => {
    console.warn(`${timestamp()} [WARN] ${message}`);
  };
  
  const error = (message) => {
    console.error(`${timestamp()} [ERROR] ${message}`);
  };
  
  const debug = (message) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`${timestamp()} [DEBUG] ${message}`);
    }
  };
  
  module.exports = {
    info,
    warn,
    error,
    debug,
  };