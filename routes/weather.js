var express = require('express');
var app = express();

var Forecast = require('forecast.io');
var geocoder = require('geocoder');
var Promise = require('bluebird');
var stylus = require('stylus');
var nib = require('nib');
var jsonPath = require('JSONPath');
var moment = require('moment');
var momenttz = require('moment-timezone');

var cacheMiddleware = require('cache-middleware');

function compile(str, path) {
  return stylus(str)
    .set('filename', path)
    .use(nib())
}

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.use(stylus.middleware({
  src: __dirname + '/public',
  compile: compile
}));
app.use(express.static(__dirname + '/public'));

var forecast = new Forecast({
  APIKey: 'c271607d25dddb23747dbb6ffe18b694',
  timeout: 10000
});

Promise.promisifyAll(geocoder);
Promise.promisifyAll(forecast);

var getLocation = function getLocation(request, response, next) {
  geocoder.geocodeAsync(request.params.location).then(function(data) {
    request.geocode = {
      location: data.results[0].geometry.location,
      name: data.results[0].formatted_address
    };
    next();
  });
};

var getWeather = function getWeather(request, response, next) {
  var location = request.geocode.location;
  forecast.getAsync(location.lat, location.lng).then(function(args) {
    request.weather = args[1];
    next();
  });
};

app.get(
  '/:location',
  cacheMiddleware(
    'geocode',
    getLocation,
    false
  ),
  function(request, response, next) {
    if (request.geocode.name !== request.params.location) {
      response.redirect(request.geocode.name);
    }
    next();
  },
  cacheMiddleware(
    'weather',
    getWeather,
    3600
  ),
  function(request, response) {
    if (request.accepts('html')) {
      response.render('weather', {
        weather: request.weather,
        geocode: request.geocode,
        moment: moment
       });
    } else if (request.accepts('json')) {
      return response.send(request.weather);
    } else {
      return response.status(400).send('I do not understand you!');
    }
  }
);

module.exports = app;