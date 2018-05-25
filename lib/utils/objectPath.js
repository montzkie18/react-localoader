module.exports = {
  get: function(obj, path) {
    var paths = path.split('.');
    var value = obj;

    for (var i = 0; i < paths.length; ++i) {
      if (!value || !value[paths[i]]) {
        return null;
      }
      value = value[paths[i]];
    }

    return value;
  }
}