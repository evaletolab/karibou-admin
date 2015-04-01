'use strict';

var express = require('express');
var config = require('./settings');
var http = require('http');
var path = require('path');
var app = exports.app = express();

app.configure(function () {
  app.set('port', config.express.port);
  app.set('views', __dirname + config.express.views);
  app.set('view engine', config.express.engine);
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser(config.session.secret));
  app.use(app.router);
  app.use(express.compress());
  app.use(express.static(path.join(__dirname, config.express.files)));
  // Render *.html files using ejs
  app.engine('html', require(config.express.engine).__express);

});

app.configure('development', function () {
  app.use(express.errorHandler());
  var exec = require('child_process').exec;
  exec('node_modules/brunch/bin/brunch watch', function callback(error, stdout, stderr) {
    if (error) {
      console.log('An error occurred while attempting to start brunch.\n' +
                  'Make sure that it is not running in another window.\n');
      throw error;
    }
  });
});

app.configure('production', function () {
});

app.configure('test', function () {
});

// Routes //
app.get('/', function (req, res) {
  res.render('index.html');
});


// Catch all route -- If a request makes it this far, it will be passed to angular.
// This allows for html5mode to be set to true. E.g.
// 1. Request '/signup'
// 2. Not found on server.
// 3. Redirected to '/#/signup'
// 4. Caught by the '/' handler passed to Angular
// 5. Angular will check for '#/signup' against it's routes.
// 6. If found
//    a. Browser supports history api -- change the url to '/signup'.
//    b. Browser does not support history api -- keep the url '/#/signup'
app.use(function (req, res) {
  res.redirect('/#' + req.url);
});

http.createServer(app).listen(app.get('port'), function () {
  console.log("Express server listening on port " + app.get('port'));
});

