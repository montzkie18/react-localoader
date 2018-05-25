var recast = require('recast');
var assert = require('./utils/assert');
var parser = require('./utils/parser');
var logger = require('./utils/logger');
var generateKey = require('./utils/generateKey');

function isLocalizeElement(node) {
  return node.type === "JSXElement"
    && node.openingElement 
    && node.closingElement
    && node.openingElement.name.name === "Localize";
}

function isTranslateCall(node) {
  if(node.type === "CallExpression") {
    var callee = node.callee;
    var receiver = callee.object;
    var method = callee.property;
    var args = node.arguments;

    return callee.type === "MemberExpression" 
      && !callee.computed 
      && receiver.type === "Identifier" 
      && receiver.name === "i18n" 
      && method.type === "Identifier" 
      && method.name === "t";
  }
  return false;
}

function hasTextToTranslate(node) {
  return isLocalizeElement(node) || isTranslateCall(node);
};

function extractTextFromElement(node, translations, description) {
  assert(node.children.length === 1, "Localize element should only have 1 child");
  var text = node.children[0].value;
  translations[generateKey(text)] = {
    description: description,
    text: text
  };
};

function extractTextFromCall(node, translations, description) {
  assert(node.arguments.length > 0, "i18n.t() should have atleast 1 argument");
  var text = node.arguments[0].value;
  translations[generateKey(text)] = {
    description: description,
    text: text
  };
}

module.exports = function extractStrings(source, description) {
  var translations = {};

  try {
    var ast = recast.parse(source, {parser: parser});
    recast.visit(ast, {
      visitJSXElement: function(path) {
        var element = path.value;
        if(hasTextToTranslate(element)) 
          extractTextFromElement(element, translations, description);
        this.traverse(path);
      },
      visitCallExpression: function(path) {
        var expression = path.value;
        if(hasTextToTranslate(expression))
          extractTextFromCall(expression, translations, description);
        this.traverse(path);
      }
    });
  }catch(e){
    logger.error("Could not parse source:", description, e, source);
  }
  
  return translations;
};