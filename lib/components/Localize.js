var React = require('react');
var PropTypes = require('prop-types');
var assert = require('../utils/assert');
var tokens = require('../utils/tokens');
var config = require('../config').get();
var i18n = require('../i18n');

function replaceChildForElement(element, child) {
  assert(
    element.props.children === '$1',
    "Replacement elements should only contain $1 as child"
  );

  var props = Object.assign({}, element.props, {children: child});
  return React.cloneElement(element, props);
};

function createChildren(props) {
  assert(
    typeof props.children === 'string', 
    "Localize only supports 'string' children"
  );

  var elements = props.elements || []; 
  var expressions = props.expressions || {};
  var substitutes = [];

  var text = props.children + "";
  text = i18n.t(text, expressions);

  elements.forEach(function(element, index) {
    var matches = text.match(tokens.pattern(tokens.TYPES.ELEM, index));
    assert(
      matches && matches.length === 2, 
      "Text to replace <" + element.type + "/>(${index}) not found"
    );

    text = text.replace(matches[0], tokens.create(substitutes.length, tokens.TYPES.PLA));
    substitutes.push(replaceChildForElement(element, matches[1]));
  });

  var newChildren = text.split(config.placeholderTag).map(function(string) {
    if(!string.match(tokens.pattern(tokens.TYPES.PLA))) return string;
    var pattern = new RegExp("\\" + config.placeholderIndexTag, "g");    
    var index = parseInt(string.replace(pattern, ''));
    return substitutes[index];
  });

  if(newChildren.length <= 1)
    return newChildren[0];

  return React.Children.toArray(newChildren);
};

function Localize(props) {
  return React.createElement(React.Fragment, {}, createChildren(props));
};

module.exports = Localize;