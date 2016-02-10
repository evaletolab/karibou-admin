;(function(angular) {'use strict';

// 
// chromium-browser --ignore-gpu-blacklist --disable-gpu-sandbox
// var API_SERVER='http://api.karibou.ch'
// var API_SERVER='http://localhost:4000';
var API_SERVER='//api.'+window.location.hostname;
// var API_SERVER='http://192.168.1.35:4000'
// var API_SERVER='http://karibou-evaletolab.rhcloud.com'
// var API_SERVER='http://karibou-api.jit.su'
// var API_SERVER='http://karibou-api.eu01.aws.af.cm'

// Declare application level module which depends on additional filters and services (most of them are custom)
angular.module('app', [
  'ngCookies',
  'ngResource',
  'ngRoute',
  'ngSanitize',
  'ngTouch',
  'ngCMS',
  'ngAnimate',
  'ngUploadcare',  
  'infinite-scroll',
  'angular.filter',
  'app.templates',
  'app.config',
  'app.storage',
  'app.raven',
  'app.api',
  'app.root',
  'app.user',
  'app.feedback',
  'app.shop',
  'app.product',
  'app.category',
  'app.order',
  'app.order.admin',
  'app.stats',
  'app.document',
  'app.wallet',
  'app.home'
])
  .value('API_SERVER',API_SERVER)
  .config(appConfig)
  .factory('errorInterceptor', errorInterceptor)
  .factory('cordovaReady',cordovaReady)
  .run(appRun);




//
// FIX (iOS 8 GM iPhone5C) TypeError: Attempted to assign to readonly property
// https://github.com/angular/angular.js/issues/9128#issuecomment-88921426
// https://gist.github.com/harrastia/4a963e62605f73bbfff2
function rootScopeFIX($provide) {
 
  // Minification-safe hack.
  var $$watchers = '$$watchers',
      $$nextSibling = '$$nextSibling',
      $$childHead = '$$childHead',
      $$childTail = '$$childTail',
      $$listeners = '$$listeners',
      $$listenerCount = '$$listenerCount',
      $$ChildScope = '$$childScope',
      $id = '$id',
      $parent = '$parent',
      $$prevSibling = '$$prevSibling',
      $root = '$root';
 
  $provide.decorator('$rootScope', ['$delegate', function($rootScope) {
    var proto = Object.getPrototypeOf($rootScope);
 
    function nextUid () {
      return ++$rootScope.$id;
    }
 
    proto.$new = function(isolate, parent) {
      var child;
 
      function destroyChild() {
        child.$$destroyed = true;
      }
 
      parent = parent || this;
 
      if (isolate) {
        child = new proto.constructor();
        child[$root] = this.$root;
      } else {
        // Only create a child scope class if somebody asks for one,
        // but cache it to allow the VM to optimize lookups.
        if (!this.$$ChildScope) {
          this[$$ChildScope] = function ChildScope() {
            this[$$watchers] = this[$$nextSibling] =
                this[$$childHead] = this[$$childTail] = null;
            this[$$listeners] = {};
            this[$$listenerCount] = {};
            this[$id] = nextUid();
            this[$$ChildScope] = null;
          };
          this[$$ChildScope].prototype = this;
        }
        child = new this[$$ChildScope]();
      }
 
      child[$parent] = parent;
      child[$$prevSibling] = parent.$$childTail;
      if (parent.$$childHead) {
        parent[$$childTail][$$nextSibling] = child;
        parent[$$childTail] = child;
      } else {
        parent[$$childHead] = parent[$$childTail] = child;
      }
 
      // When the new scope is not isolated or we inherit from `this`, and
      // the parent scope is destroyed, the property `$$destroyed` is inherited
      // prototypically. In all other cases, this property needs to be set
      // when the parent scope is destroyed.
      // The listener needs to be added after the parent is set
      if (isolate || parent != this) child.$on('$destroy', destroyChild);
 
      return child;
    };
    $rootScope.$new = proto.$new;
    return $rootScope;
  }]);
}
//
// Scroll events can be triggered very frequently, which can hurt performance and make scrolling appear jerky.
//angular.module('infinite-scroll').value('THROTTLE_MILLISECONDS', 500)

//
// Configure application $route, $location and $http services.
appConfig.$inject=['$provide','$routeProvider','$locationProvider','$httpProvider'];
function appConfig( $provide, $routeProvider, $locationProvider, $httpProvider) {
  
  // FIX IOS error
  rootScopeFIX($provide);

  $httpProvider.interceptors.push('errorInterceptor');

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
    .when('/welcome',{templateUrl:'/partials/pages/welcome.html'})
    .when('/the-site-is-currently-down-for-maintenance-reasons', {title:'the site is currently down for maintenance reasons',templateUrl : '/partials/errors/down.html'})
    .when('/about', {title:'about',templateUrl : '/partials/about.html'})
    .when('/page/doc/:article?',{title: 'markdown content', templateUrl: '/partials/pages/page.html'})
    .when('/page/:article?',{title: 'markdown content', templateUrl: '/partials/pages/page.html'})
    // 404
    .when('/404', {title:'404',templateUrl : '/partials/errors/404.html'})
    // Catch all
    .otherwise({redirectTo : '/404'});

  // Without serve side support html5 must be disabled.
  $locationProvider.html5Mode(true);
  // $locationProvider.hashPrefix('!');
}


// define default behavior for all http request
// http://www.webdeveasy.com/interceptors-in-angularjs-and-useful-examples/
errorInterceptor.$inject = ['$q', '$rootScope', '$location', '$timeout'];
function errorInterceptor($q, scope, $location, $timeout) {
  var error_net=0;
  function parseError(err){
      if(typeof err === 'string') {return err;}
      if(typeof err.responseText === 'string'){return err.responseText;}
      if(typeof err.data === 'string'){return err.data;}       
      if(typeof err.message === 'string'){return err.message;}       
      if(err.data&&err.data.length){
        var msg="";
        err.data.forEach(function(e){
          msg=msg+"<p>"+e+"</p>";
        });
        return msg;
      }         
      return "Undefined error! ->"+JSON.stringify(err);
  }

  function showError($scope, err, ms){
    $scope.FormErrors=parseError(err);
    $timeout(function(){
      $scope.FormErrors=undefined;
    }, ms||5000);
  }

  return {
      request: function (config) {
          scope.WaitText = 'Working...';
          NProgress.start();
          return config || $q.when(config);
      },
      requestError: function (request) {
          return $q.reject(request);
      },
      response: function (response) {
          scope.WaitText = false;error_net=0;
          NProgress.done();
          return response || $q.when(response);
      },
      responseError: function (response) {
          scope.WaitText = false;
          // no api
          if (response.status === 0) {
              error_net++;
          }


          if (error_net > 1) {
            $location.path('/the-site-is-currently-down-for-maintenance-reasons');
          }

          // server/api error
          //
          // on error analytics log 
          if(window.ga && response.data && [0,401].indexOf(response.status)==-1 ){
            window.ga('send', 'event', 'error', response.data);
          }

          //
          // if we are anonymous in the wrong place ...
          if(401===response.status){
            var longpath=$location.path();
            // user state is updated async after this call, so the current state is wrong!
            // if(!scope.user.isAuthenticated() && _.find(['/account','/admin','/order/'],function(path){
            if(_.find(['/account','/admin','/order/'],function(path){
              return (longpath.indexOf(path)!==-1);
            })){
              $location.path('/login');
            }else if (response.data.toLowerCase().indexOf('vous devez ouvrir')){
              // if logged but without correct right 
              showError(scope,response.data);            
            }else if(response.config.url.indexOf('/v1/users/me')===-1){
              showError(scope,"Access denied!")
            }
          }

          else if(response.status>0){
            showError(scope,response.data);
          }
          NProgress.done();

          return $q.reject(response);
      }
  };
}


//
// boostrap mobile app
function cordovaReady() {
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
}


//
// init the module
appRun.$inject=['gitHubContent', '$templateCache', '$route', '$http','$timeout', 'config'];
function appRun(gitHubContent, $templateCache, $route, $http, $timeout, config) {
  gitHubContent.initialize({
        root:'page', // specify the prefix route of your content
        githubRepo:config.github.repo,
        githubToken:config.github.token
    });


  // special setup that depends on config 
  config.shop.then(function () {
      // config stripe here
      var pk=config.shop.keys&&config.shop.keys.pubStripe||'pk_test_PbzvxL5vak34c2GvSFqUXEac';

      //
      // loading Stripe
      setTimeout(function() {
        console.log('window.Stripe.setPublishableKey',pk,window.Stripe)
        window.Stripe.setPublishableKey(pk);          
      }, 500);

      // basket.ready('app').then(function() {
      // })

      // init uploadcare key here
      config.uploadcare=config.shop.keys.pubUpcare;
      uploadcare.start({ publicKey: config.uploadcare, maxSize:153600});  


  });


}


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
  // $script(["https://login.persona.org/include.js"],"persona");


  if(!window.btoa){
    window.btoa = function(str, utf8encode) {  // http://tools.ietf.org/html/rfc4648
      utf8encode =  (typeof utf8encode == 'undefined') ? false : utf8encode;
      var o1, o2, o3, bits, h1, h2, h3, h4, e=[], pad = '', c, plain, coded;
      var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
       
      plain = utf8encode ? Utf8.encode(str) : str;
      
      c = plain.length % 3;  // pad string to length of multiple of 3
      if (c > 0) { while (c++ < 3) { pad += '='; plain += '\0'; } }
      // note: doing padding here saves us doing special-case packing for trailing 1 or 2 chars
       
      for (c=0; c<plain.length; c+=3) {  // pack three octets into four hexets
        o1 = plain.charCodeAt(c);
        o2 = plain.charCodeAt(c+1);
        o3 = plain.charCodeAt(c+2);
          
        bits = o1<<16 | o2<<8 | o3;
          
        h1 = bits>>18 & 0x3f;
        h2 = bits>>12 & 0x3f;
        h3 = bits>>6 & 0x3f;
        h4 = bits & 0x3f;

        // use hextets to index into code string
        e[c/3] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
      }
      coded = e.join('');  // join() is far faster than repeated string concatenation in IE
      
      // replace 'A's from padded nulls with '='s
      coded = coded.slice(0, coded.length-pad.length) + pad;
       
      return coded;
    };  
  }

  Date.prototype.daysInMonth=function(month) {
    //var y=this.getFullYear(), m=(month||this.getMonth())
    //return /8|3|5|10/.test(m)?30:m==1?(!(y%4)&&y%100)||!(y%400)?29:28:31;
    return new Date(this.getFullYear(), (month||this.getMonth())+1, 0).getDate();
  };  

  //console.log(window.Showdown.extensions)
  angular.bootstrap(document, ['app']);
});

})(window.angular);
