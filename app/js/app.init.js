'use strict';

// Declare application level module which depends on additional filters and services (most of them are custom)
var App = angular.module('app', [
  'ngCookies',
  'ngResource',  
  'app.config',
  'ui',
  'app.api',
  'app.root',
  'app.user',
  'app.shop',
  'app.product',
  'app.category',
  'app.home'
]);



// Configure application $route, $location and $http services.
App.config([
  '$routeProvider',
  '$locationProvider',
  '$httpProvider',

  function ($routeProvider, $locationProvider, $httpProvider) {

    //console.log("$httpProvider.defaults",$httpProvider.defaults);
    $httpProvider.defaults.crossDomain=true;
    $httpProvider.defaults.withCredentials=true;
    
    // List of routes of the application
    $routeProvider
      // Pages
      .when('/about', {title:'about',templateUrl : '/partials/about.html'})
      .when('/pages/charte', {title:'about',templateUrl : '/partials/charte.html'})

      // 404
      .when('/404', {title:'404',templateUrl : '/partials/errors/404.html'})
      // Catch all
      .otherwise({redirectTo : '/404'});

    // Without serve side support html5 must be disabled.
    $locationProvider.html5Mode(true);
    $locationProvider.hashPrefix = '!';
    
  }
]);

// Bootstrap (= launch) application
angular.element(document).ready(function () {
  //
  // set api key
  filepicker.setKey("At5GnUxymT4WKHOWpTg5iz");

  angular.bootstrap(document, ['app']);
});


