'use strict';

// Declare application level module which depends on additional filters and services (most of them are custom)
var App = angular.module('app', [
  'ngCookies',
  'ngResource',  
  'ngRoute',
  'app.config',
  'app.api',
  'app.root',
  'app.user',
  'app.shop',
  'app.product',
  'app.category',
  'app.order',
  'app.home'
]);



// Configure application $route, $location and $http services.
App.config([
  '$routeProvider',
  '$locationProvider',
  '$httpProvider',

  function ($routeProvider, $locationProvider, $httpProvider) {

    var interceptor = ['$rootScope', '$q', function (scope, $q) {
      function success(response) {
          scope.WaitText = false;
          NProgress.done(500);
          return response;
      }

      function error(response) {
          scope.WaitText = false;
          NProgress.done(500);
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
  // set api key
  filepicker.setKey("At5GnUxymT4WKHOWpTg5iz");
  
  // http://wojodesign.com/simpleCart/
  // <a href="#" 
  //    onclick="simpleCart.add('quantity=1','name=Black Gold','price=58','image=images/thumbs/blackGold.jpg');return false;"> 
  //    add to cart
  // </a>
  var s=simpleCart({
      cartColumns: [
	      //A custom cart column for putting the quantity and increment and decrement items in one div for easier styling.
	      { view: function(item, column){
		      return	"<span>"+item.get('quantity')+"</span>" + 
				      "<div>" +
					      "<a href='javascript:;' class='simpleCart_increment'><img src='/img/cart/increment.png' title='+1' alt='arrow up'/></a>" +
					      "<a href='javascript:;' class='simpleCart_decrement'><img src='/img/cart/decrement.png' title='-1' alt='arrow down'/></a>" +
				      "</div>";
	      }, attr: 'custom' },
	      //Name of the item
	      { attr: "name" , label: false },
	      //Subtotal of that row (quantity of that item * the price)
	      { view: 'currency', attr: "total" , label: false  }
      ],

      checkout: { 
          type: "PayPal" , 
          email: "evaleto@gmail.com" 
      },
      cartStyle:'div',
      shippingFlatRate: 7,
      tax:        0.01,
      currency:   "CHF"
  });

	  

  angular.bootstrap(document, ['app']);
});


