var loader = require('./lib/webpackLoader');
var i18n = require('./lib/i18n');
var config = require('./lib/config');
var Localize = require('./lib/components/Localize');

module.exports = loader;
module.exports.i18n = i18n;
module.exports.config = config;
module.exports.Localize = Localize;