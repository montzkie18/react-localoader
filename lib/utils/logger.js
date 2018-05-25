var debug = require('debug');

var logger = debug('react-localoader:app');
logger.error = debug('react-localoader:app:error');

module.exports = logger;