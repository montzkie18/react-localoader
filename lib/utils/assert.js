var invariant = require('invariant');
var config = require('../config').get();
var logger = require('./logger');

module.exports = function(expression, message) {
  if(config.strict)
    invariant(expression, message);
  else if(!expression)
    logger("[WARNING]", message);
};