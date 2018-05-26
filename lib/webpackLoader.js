require('./config').load(); // load configurations from .i18rc file
var injectLocalization = require('./injectLocalization');

module.exports = function load(source) {
  this.cacheable();
  return injectLocalization(source);
};