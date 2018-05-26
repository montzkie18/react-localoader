var invariant = require('invariant');
var config = require('../config');
var logger = require('./logger');

module.exports = function(expression, message) {
  if(config.get().strict)
    invariant(expression, message);
  else if(!expression)
    logger("[WARNING]", message);
};