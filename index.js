var express = require('express'),
    app = express(),
    Promise = require('bluebird'),
    fs = Promise.promisifyAll(require('fs')),
    path = require('path'),
    ROUTES_DIR = __dirname + '/routes/';

var routeFiles = fs.readdirAsync(ROUTES_DIR);

var filterExtension = function(extension) {
  return function(file) {
    return path.extname(file) == '.' + extension;
  };
};

routeFiles.then(function(routeFiles) {
  routeFiles
    .map(function(file) { return path.join(ROUTES_DIR, file); })
    .filter(filterExtension('js'))
    .forEach(function(file) {
      console.log(file);
      var name = path.basename(file).replace(/\.[^.]*$/, '');
      var route = require(file);
      var mountAt;

      switch (name) {
        default:
          mountAt = name;
      };

      console.log('Mounting routes contained in ' + file + ' at ' + mountAt);
      if (typeof mountAt !== 'undefined') {
        app.use('/' + mountAt, route);
      } else {
        app.use(route);
      }
    });
});

app.listen(3000);
