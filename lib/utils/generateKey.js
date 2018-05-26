var crc32 = require('crc32');
var slugify = require('speakingurl');
var config = require('../config');

module.exports = function generateKey(string) {
  var key = slugify(string, {separator: '_', lang: false})
    .replace(/[-_]+/g, '_')
    .substring(0, config.get().maxTranslationKeyLength);
  var checksum = crc32(string.length + ":" + string).toString(16);
  return key + "_" + checksum;
};