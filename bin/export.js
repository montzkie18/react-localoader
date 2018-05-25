var fs = require('fs');
var glob = require('glob');
var path = require('path');
var mkdirp = require('mkdirp');
var config = require('../lib/config').load();
var extractStrings = require('../lib/extractStrings');
var injectLocalization = require('../lib/injectLocalization');

module.exports = function() {
  var translations = {};
  for(var srcIndex in config.srcFolders) {
    var src = config.srcFolders[srcIndex];
    var files = glob.sync(path.join(config.basePath, src, '**', '*.js'));
    for(var fileIndex in files) {
      var file = files[fileIndex];
      var source = fs.readFileSync(file, "utf8");
      console.log("Extracting from file", file);
      Object.assign(translations, extractStrings(injectLocalization(source), file))
    }
  }

  var filePath = path.join(config.exportPath, config.defaultLocale + ".json");
  if(!fs.existsSync(config.exportPath)) {
    mkdirp(config.exportPath, function(error) {
      if(error) console.log(error);
      else fs.writeFileSync(filePath, JSON.stringify(translations, null, 2), 'utf8');
    });
  }else{
    fs.writeFileSync(filePath, JSON.stringify(translations, null, 2), 'utf8');
  }
}