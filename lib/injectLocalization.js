var parser = require('./utils/parser');
var logger = require('./utils/logger');
var tokens = require('./utils/tokens');
var config = require('./config').load();
var recast = require('recast');
var builders = recast.types.builders;

function isTranslatableElement(node) {
  if(node.type === 'JSXElement') {
    // don't translate single tag elements without children 
    // (e.g. <div/>, <span/>, etc...)
    if(!node.openingElement || !node.closingElement)
      return false;
    
    // translate elements with atleast a single 
    // non-whitespace text as child
    var hasText = node.children.some(isText);
    var hasTextExpressions = node.children.some(isTextExpression);
    
    return hasText || hasTextExpressions;
  }
  return false;
}

function isTranslatableAttribute(node) {
  return node.type === 'JSXAttribute' 
    && config.attributeNames.some(function(name) {
      return node.name.name.match(new RegExp(name, "i"))
    })
    && !config.attributeIgnores.some(function(name) {
      return node.name.name === name;
    })
    && (isTextString(node.value) || isTextExpression(node.value));
}

function isTranslatableExpression(node) {
  return node.type === 'JSXExpressionContainer' 
    && [
      "Identifier", 
      "MemberExpression", 
      "StringLiteral", 
      "TemplateLiteral"
    ].includes(node.expression.type);
}

function isText(node) {
  return ['JSXText'].includes(node.type)
    && typeof node.value === 'string'
    && node.value.trim().match(/[a-zA-Z]+/);
}

function isTextString(node) {
  return ['StringLiteral'].includes(node.type)
    && typeof node.value === 'string'
    && node.value.trim().match(/[a-zA-Z]+/); 
}

function isTextExpression(node) {
  return node.type === 'JSXExpressionContainer' && (
    (
      node.expression.type === 'StringLiteral' 
    && !(node.expression.value.startsWith('<')
      || node.expression.value.endsWith('>'))
    )
    || 
    (
      node.expression.type === 'TemplateLiteral'
      && node.expression.quasis.some(function(exp) {
        return exp.type === 'TemplateElement' && exp.value.raw.match(/[a-zA-Z]+/)
      })
    )
  );
}

function hasTranslatableChild(node) {
  return isTranslatableElement(node) || (node.children 
    && node.children.some(hasTranslatableChild));
}

function textToLocalizeElement(text, elements, expressions) {
  var properties = [];

  if(elements && elements.length) {
    var elementsExpression = builders.arrayExpression(elements);
    properties.push(
      builders.jsxAttribute(
        builders.jsxIdentifier("elements"),
        builders.jsxExpressionContainer(elementsExpression)
      )
    );
  }

  if(expressions && Object.keys(expressions).length) {
    var expressionsObject = builders.objectExpression([]);
    for(var key in expressions) {
      expressionsObject.properties.push(
        builders.property("init", builders.stringLiteral(key), expressions[key])
      );
    }
    properties.push(
      builders.jsxAttribute(
        builders.jsxIdentifier("expressions"),
        builders.jsxExpressionContainer(expressionsObject)
      )
    );
  }

  return builders.jsxElement(
    builders.jsxOpeningElement(
      builders.jsxIdentifier(config.componentName),
      properties
    ),
    builders.jsxClosingElement(
      builders.jsxIdentifier(config.componentName)
    ),
    [builders.stringLiteral(text)]
  );
}

function textToTranslateExpression(text, expressions, node) {
  var args = [builders.stringLiteral(text)];

  if(expressions && Object.keys(expressions).length) {
    var expressionsObject = builders.objectExpression([]);
    for(var key in expressions) {
      expressionsObject.properties.push(
        builders.property("init", builders.stringLiteral(key), expressions[key])
      );
    }
    args.push(expressionsObject);
  }

  var receiver = builders.identifier("i18n");
  receiver.loc = node.loc;
  return builders.callExpression(
    builders.memberExpression(
      receiver,
      builders.identifier("t"),
      false
    ),
    args
  );
}

/**
 *  Generates an identifier for a javascript expression.
 *  First we remove enclosing ${} so we just end up with the jsExpression.
 *  Then we remove all special characters and replace . with -.
 *  e.g. 
 *    input: (this.props.user || {}).name
 *    output: this-props-user-name
 */
function keyForExpression(expression) {
  return expression
    .replace(/\$\{(.+)\}/, '$1')
    .replace(/[^a-zA-Z\d\.]/g, '')
    .replace(/\./g, '-');
}

function translateExpression(node, expressions) {
  // print the JSX code for the node then
  // remove all leading and trailing {`'""'`} and just get the expression
  var code = recast.print(node).code;
  var expression = code.replace(/^(\{\s*['"`])/, '').replace(/(['"`]\s*\})$/, '');

  if(node.expression.type === 'Identifier' || 
    node.expression.type === 'MemberExpression') {
    // This could be a local variable or an object property
    // so we replace the whole expression with a placeholder.
    // e.g. 
    //    input: this.props.user
    //    output: %[this-props-user]
    var memberKey = keyForExpression(expression);
    expression = tokens.create(memberKey, tokens.TYPES.EXP);
    expressions[memberKey] = node.expression;
  }
  else if(node.expression.type === 'TemplateLiteral') {
    // Template literals have this format => random text with ${jsExpressions}
    // so we extract all jsExpressions so we can replace them with placeholders
    // and then combine all random text with all of the aggregated text.
    // e.g.
    //    input: ${user.name} have ${this.props.messages.length+1} messages
    //    output: %[user-name] have %[this-props-messages-length1] messages
    var matches = expression.match(/\$\{.+?\}/g);
    var codeExpressions = node.expression.expressions 
      ? node.expression.expressions 
      : [node.expression];

    if(matches && matches.length === codeExpressions.length) {
      matches.forEach(function(match, index) {
        var expressionKey = keyForExpression(match);
        expression = expression.replace(match, tokens.create(expressionKey, tokens.TYPES.EXP));
        expressions[expressionKey] = codeExpressions[index];
      });
    }
  }

  return expression;
}

function translateElement(node, elements, expressions) {
  var newChildren=[], text="";
  elements = elements || [];
  expressions = expressions || {};

  function addTextNode() {
    if(text) {
      // check if there's alphanumeric characters in the text
      // there's no point localizing special character strings only
      if(text.trim().match(/[a-zA-Z]+/)) {
        // leading and trailing whitespace should not be included in the
        // localized strings as translators could easily delete it
        // changing the original layout of the DOM
        // e.g. <b>text <img/></b> => <b><Localized>text></Localized> <img/></b>
        var leadingSpaces = text.trimRight().match(/^(\s+)/);
        if(leadingSpaces && leadingSpaces.length)
          newChildren.push(builders.jsxText(leadingSpaces[0]));

        var node = textToLocalizeElement(
          text.trim(), 
          elements, 
          expressions
        );
        newChildren.push(node);

        var trailingSpaces = text.trimLeft().match(/(\s+)$/);
        if(trailingSpaces && trailingSpaces.length)
          newChildren.push(builders.jsxText(trailingSpaces[0]));
      }else{
        // otherwise, just leave the text as JSText and don't localize
        newChildren.push(builders.jsxText(text));
      }

      logger("Added text to translate", text.trim());
    }
    text = "";
    elements = [];
    expressions = {};
  };

  node.children
    .forEach(function(child) {
      // aggregate all succeeding text children
      if(child.type === 'JSXText') {
        text += child.value;
      }
      // if child element has a string literal as direct descendant
      // but make sure it doesn't have another element as child
      else if(child.type === 'JSXElement' && isTranslatableElement(child)
        && !child.children.some(isTranslatableElement)) {
        var elementChildren = translateElement(child, elements, expressions);

        // if it produced a localized text, then we can just append
        // it to our existing aggregated text
        if(elementChildren.length 
          && elementChildren[0].type === 'JSXElement' 
          && elementChildren[0].name.name === config.componentName 
          && elementChildren.filter(hasTranslatableChild).length === 0) {

          var elementContents = elementChildren.shift().children.shift().value;
          text += tokens.create(elementContents, tokens.TYPES.ELEM, elements.length);

          // replace the contents of this element with a placeholder text
          // and save it so we can pass it as an attribute to the Localize component
          elements.push(Object.assign({}, child, {
            children: [builders.stringLiteral('$1')].concat(elementChildren.splice(0))
          }));
        }

        // if this child element produced not just a translated string
        // then we cut the text aggregation and insert the other elements
        if(elementChildren.length > 0) {
          addTextNode();
          newChildren.push.apply(newChildren, elementChildren);
        }
      }
      // if child element contains interpolated strings
      else if(child.type === 'JSXExpressionContainer' && isTranslatableExpression(child)) {
        text += translateExpression(child, expressions);
      }
      else {
        // cut the text aggregation and add a new child node
        addTextNode();
        newChildren.push(child);
      }
    });

  // add the last aggregated text to our children
  addTextNode();

  return newChildren;
}

function translateAttribute(node) {
  var expressions = {};
  var text = "";

  if(node.type === "StringLiteral")
    text = node.value;
  else if(node.type === "JSXExpressionContainer")
    text = translateExpression(node, expressions);

  return builders.jsxExpressionContainer(
    textToTranslateExpression(text, expressions, node)
  );
}

module.exports = function injectLocalization(source) {
  var didInjectElement = false;
  var didInjectAttribute = false;

  var ast = recast.parse(source, {parser: parser});
  recast.visit(ast, {
    visitJSXElement: function(path) {
      var element = path.value;
      if(isTranslatableElement(element)) {
        element.children = translateElement(element);
        didInjectElement = true;
      }
      this.traverse(path);
    },
    visitJSXAttribute: function(path) {
      var attribute = path.value;
      if(isTranslatableAttribute(attribute)) {
        attribute.value = translateAttribute(attribute.value);
        didInjectAttribute = true;
      }
      this.traverse(path);
    },
  });

  var code = recast.print(ast).code;
  if(didInjectElement)
    code = config.componentImport + "\n" + code;
  if(didInjectAttribute)
    code = config.i18nImport + "\n" + code;
  return code;
}