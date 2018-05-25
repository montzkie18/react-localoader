var injectLocalization = require('./injectLocalization');

module.exports = function load(source) {
  this.cacheable();
  return injectLocalization(source);
};