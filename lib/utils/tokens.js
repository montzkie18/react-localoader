var config = require('../config').get();

var TOKEN_TYPES = Object.freeze({
  ELEM: "elements",
  EXP: "expressions",
  PLA: "placeholders",
});

function sandwich(text, left, right) {
  right = right || left;
  return left + text + right;
}

function charWithLength(char, length) {
  return new Array(length).join(char);
}

module.exports = {
  TYPES: TOKEN_TYPES,
  create: function(string, type, index) {
    switch(type) {
      case TOKEN_TYPES.ELEM:
        return sandwich(string, charWithLength(config.elementTag, index+2));
      case TOKEN_TYPES.EXP:
        return sandwich(string, config.expressionOpening, config.expressionClosing);
      case TOKEN_TYPES.PLA:
        return sandwich(sandwich(string, config.placeholderIndexTag), config.placeholderTag);
      default:
        throw new Error("Unknown token type");
    }
  },
  pattern: function(type, index) {
    switch(type) {
      case TOKEN_TYPES.ELEM:
        var c = config.elementTag;
        var tag = charWithLength("\\" + c, index+2);
        return new RegExp(sandwich("([^\\" + c + "]+?)", tag));
      case TOKEN_TYPES.PLA:
        return new RegExp(sandwich("\\d", "\\" + config.placeholderIndexTag));
      default:
        throw new Error("Unknown pattern type");
    }
  },
};