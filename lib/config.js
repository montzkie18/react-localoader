var logger = require('./utils/logger');
var fs;

var defaultConfig = {
  componentName: 'Localize',
  componentImport: 'import Localize from "react-localoader/lib/components/Localize";',
  i18nImport: 'import i18n from "react-localoader/lib/i18n";',

  strict: true,

  elementTag: "*",

  expressionOpening: "%[",

  expressionClosing: "]",

  placeholderTag: "~~~",

  placeholderIndexTag: "$",

  maxTranslationKeyLength: 16,

  basePath: '.',

  srcFolders: ['src'],

  exportPath: './public/locale',

  defaultLocale: 'en',

  attributeNames: ['title', 'placeholder', 'label', 'tooltip', 'content'],
  attributeIgnores: ['id', 'name', 'className'],
};

function loadConfig() {
  fs = fs || require('fs');

  var configPath = ".i18nrc";
  var config = {};

  if(fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (e) {
      logger.error("Failed to load config", e);
    }
  }

  return config;
}

module.exports = {
  __userConfig: null,
  load: function() {
    if(!this.__userConfig)
      this.__userConfig = loadConfig();
    return this.get();
  },
  get: function() {
    var config = Object.assign({}, defaultConfig, this.__userConfig);
    return Object.freeze(config);
  },
  set: function(conf) {
    this.__userConfig = conf;
  }
}