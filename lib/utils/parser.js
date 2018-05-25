var parse = require('babylon').parse;

module.exports = {
  parse: function(source) {
    return parse(source, {
      sourceType: "module", 
      plugins: [
        "jsx", "classProperties", "objectRestSpread"
      ]
    });
  }
};