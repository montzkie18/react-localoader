var generateKey = require('./utils/generateKey');
var objectPath = require('./utils/objectPath');
var assert = require('./utils/assert');
var tokens = require('./utils/tokens');
var config = require('./config').get();

module.exports = {
  _locale: config.defaultLocale || 'en',
  get locale() {
    return this._locale;
  },
  set locale(code) {
    this._locale = code;
  },
  _translations: {},
  get translations() {
    return this._translations[this.locale];
  },
  set translations(dictionary) {
    this._translations[this.locale] = dictionary;
  },
  t: function(text, placeholders) {
    var key = generateKey(text) + ".text";
    var translation = objectPath.get(this.translations, key);
    if(!translation)
      translation = text;

    var result = translation.slice(0);
    if(placeholders && placeholders.constructor === Object) {
      Object.keys(placeholders).forEach(function(key) {
        var placeholder = tokens.create(key, tokens.TYPES.EXP);
        assert(result.includes(placeholder), "Expression " + key + " not found");
        result = result.replace(placeholder, placeholders[key]);
      });
    }

    return result;
  }
};