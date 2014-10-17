;(function(angular) {
'use strict';

// var API_SERVER='http://localhost:4000'
var API_SERVER='http://api.karibou.evaletolab.ch'
// var API_SERVER='http://192.168.1.35:4000'
// var API_SERVER='http://karibou-api.cloudfoundry.com'
// var API_SERVER='http://karibou-evaletolab.rhcloud.com'
// var API_SERVER='http://karibou-api.jit.su'
// var API_SERVER='http://karibou-api.eu01.aws.af.cm'

// Declare application level module which depends on additional filters and services (most of them are custom)
var App = angular.module('app', [
  'ngCookies',
  'ngResource',  
  'ngRoute',
  'ngSanitize',
  'app.config',
  'app.raven',
  'app.api',
  'app.root',
  'app.user',
  'app.shop',
  'app.product',
  'app.category',
  'app.order',
  'app.home'
]).value('API_SERVER',API_SERVER);



// Configure application $route, $location and $http services.
App.config([
  '$provide',
  '$routeProvider',
  '$locationProvider',
  '$httpProvider',
  function ( $provide, $routeProvider, $locationProvider, $httpProvider) {
    var error_net=0;
    var interceptor = ['$rootScope', '$q','$location', function (scope, $q, $location) {
      function success(response, config) {
          scope.WaitText = false;error_net=0;
          NProgress.done();


          return response;
      }

      function error(response) {
          scope.WaitText = false;
          NProgress.done();
          response.status||error_net++
          if (error_net > 1) {
            $location.path('/the-site-is-currently-down-for-maintenance-reasons');
          }

          if(window.ga && response.data && [0,401].indexOf(response.status)==-1 ){
            window.ga('send', 'event', 'error', response.data);
          }

          return $q.reject(response);
      }

      return function (promise) {
          scope.WaitText = 'Working...';
          NProgress.start();
          return promise.then(success, error);
      }
    }];
    $httpProvider.responseInterceptors.push(interceptor);  

    //console.log("$httpProvider.defaults",$httpProvider.defaults);
    $httpProvider.defaults.crossDomain=true;
    $httpProvider.defaults.withCredentials=true;

    //
    // clear the cache
    //$httpProvider.defaults.headers.common['Cache-Control']='no-cache';
    //$templateCache.removeAll()

    // List of routes of the application
    $routeProvider
      // Pages
      .when('/the-site-is-currently-down-for-maintenance-reasons', {title:'the site is currently down for maintenance reasons',templateUrl : '/partials/errors/down.html'})
      .when('/about', {title:'about',templateUrl : '/partials/about.html'})

      // 404
      .when('/404', {title:'404',templateUrl : '/partials/errors/404.html'})
      // Catch all
      .otherwise({redirectTo : '/404'});

    // Without serve side support html5 must be disabled.
    $locationProvider.html5Mode(true);
    $locationProvider.hashPrefix = '!';
    

  }
]);


//
// boostrap mobile app
App.factory('cordovaReady', function() {
  return function (fn) {

    var queue = [];

    var impl = function () {
      queue.push(Array.prototype.slice.call(arguments));
    };

    document.addEventListener('deviceready', function () {
      queue.forEach(function (args) {
        fn.apply(this, args);
      });
      impl = fn;
    }, false);

    return function () {
      return impl.apply(this, arguments);
    };
  };
});

// Bootstrap (= launch) application
angular.element(document).ready(function () {

  //
  // loading fastclick for mobile tap
  FastClick.attach(document.body);


  //
  // loading leafletjs and the directive
  // $script(["//cdn.leafletjs.com/leaflet-0.7/leaflet.js",
  //      "//rawgithub.com/tombatossals/angular-leaflet-directive/master/dist/angular-leaflet-directive.min.js"],
  //      "leaflet");
  



  //
  // firefox security
  $script(["https://login.persona.org/include.js"],"persona");
  
  

  angular.bootstrap(document, ['app']);
});

})(window.angular);