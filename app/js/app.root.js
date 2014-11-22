;(function(angular) {'use strict';


//
// Define the application level controllers
angular.module('app.root', [
  'app.config',
  'app.user'
])

// .decorator("$exceptionHandler", ['user', function(user) {
//   Raven.config('https://public@getsentry.com/1',{
//     shouldSendCallback:function(data){
//       console.log(data)
//       return false
//     }
//   }).install()

//   return function(exception, cause) {
//     // $delegate(exception, cause);
//     if(window.Raven){
//       Raven.captureException(exception,cause)
//     }
//   };
// }])

//
// the AppCtrl is used in index.html (see app/assets/index.html)
.controller('AppCtrl', [
  '$scope',
  '$rootScope',
  '$window',
  '$location',
  '$templateCache',
  '$routeParams',
  '$anchorScroll',
  'config',
  'api',
  'user',
  'cart',
  'category',
  'product',
  function ($scope, $rootScope, $window,  $location, $templateCache, $routeParams,$anchorScroll, config, api, user, cart, category, product) {


    var cb_error=api.error($scope);

    $scope.cart = cart;
    $scope.user = user;
    $scope.categories = [];
    $scope.config=config;
    $scope.showCart=false;
    $scope.cover='img/localfood.jpg'        


    //
    // check and init the session    
    user.me(function(u){
      $scope.user = u;
      // dont use error callback, you will lloose anonymous setting
    });

    
    //
    // get categories
    category.select({stats:true},function(categories){
      $scope.category=category;
    },cb_error);


    //
    // clear cache
    $rootScope.$on('$viewContentLoaded', function() {
      //$templateCache.removeAll();

      if($window.ga && config.API_SERVER.indexOf('localhost')==-1){
        $window.ga('send', 'pageview', { page: $location.path() });        
      }
    });

    //
    // get the head title up2date 
    $rootScope.$on('$routeChangeStart', function (event, current, previous) {
      $scope.showCart=false;
      var longpath=$location.path();
      user.$promise.finally(function(){
        if (!user.isAuthenticated()){
          if(_.find(config.loginPath,function(path){
            return (longpath.indexOf(path)!==-1);
          })){
            $location.path('/login');
          }
        }

        $rootScope.title = (current.$$route.title)?current.$$route.title:current.$$route.templateUrl;

      })
    });



    // Uses the url to determine if the selected
    // menu item should have the class active.
    $rootScope.$watch(function(){return $location.path();}, function (path, old) {
      $scope.activeNavId = path || '/';

      //
      // save the referer FIXME path or url??
      $rootScope.referrer=(path!== old)?old:undefined;
    });


    //
    // this is an helper for avoid the default sorting by ng-repeat
    $scope.keys=function(map){
      if(!map)return [];
      return Object.keys(map);
    }


    $rootScope.locationReferrer=function(defaultUrl){
      $location.path($rootScope.referrer?$rootScope.referrer:defaultUrl)
    }



    $rootScope.showMenuOnSwipe=function(){
      //$('nav.site-nav').click();
    }

    $rootScope.hideMenuOnSwipe=function(){
      //$('nav.site-nav').click();
    }


    $scope.gotoAnchor = function(x) {
      var newHash = x;
      if ($location.hash() !== newHash) {
        // set the $location.hash to `newHash` and
        // $anchorScroll will automatically scroll to it
        $location.hash(x);
      } else {
        // call $anchorScroll() explicitly,
        // since $location.hash hasn't changed
        $anchorScroll();
      }
    };


    $scope.toggle = function (params,clear) {
      if(clear){
        $location.search({})
      }
      angular.forEach(params, function (v, k) {
          var t = ($location.search()[k] && $location.search()[k] === v) ? null : v;
          $location.search(k, t)
      });
    }

    $scope.getToggleClass=function(key,value, clazz){
      if(!clazz)clazz='active'
      // for '/'
      if(!key) {
        return (Object.keys($routeParams).length===0)?clazz:'';
      }

      // search options
      return ($routeParams[key]==value)?clazz:''
    }

    // getClass compares the current url with the id.
    // If the current url starts with the id it returns 'active'
    // otherwise it will return '' an empty string. E.g.
    //
    //  // current url is '/products/1'
    //  getClass('/products'); // returns 'active'
    $scope.getClass = function (id, or) {
      if (!$scope.activeNavId)return '';
      if ($scope.activeNavId.substring(0, id.length) === id) {
        return 'active';
      }
      if (or && $scope.activeNavId.substring(0, or.length) === or) {
        return 'active';
      }
      return '';
    };
   


    $scope.getCover=function(){
      $scope.cover='img/localfood.jpg'        
      var template='/partials/cover.html';


      if ($routeParams.category){
         var c=category.findBySlug($routeParams.category);
         if(c&&c.cover) $scope.cover=c.cover;
         template='/partials/product/cover.html'
      }

      if(user.isAuthenticated())
        template='/partials/account/cover.html';


      return template;
    }

    $scope.showOverview=function(){
      $location.path('/account/overview')
    }

    $scope.showOrder=function(){
      $location.path('/account/orders')

    }

    $scope.showLove=function(){
      $location.path('/account/love')
    }

    //
    // logout (global function)
    $scope.logout=function(){
      user.logout(function(user){
        $scope.user=user;
        $location.url('/');
      });
    };

    //
    // validate user email
    $scope.verify=function(user){
      $rootScope.WaitText="Waiting ..."
      user.validateEmail(function(validate){
        api.info($scope,"Merci, une confirmation a été envoyée à votre adresse email");
        if (!user.isAuthenticated())
          $location.url('/');
      },cb_error);
    }
    
    //
    // the size of shop and product cart
    $scope.getFormat=function(index){      
      if (index===undefined) return 'c2';
      return (!index)?"c3":"c2";
    }    


    $scope.toggleCart=function(sel){
      $scope.showCart=!$scope.showCart;
    }
    



  }
]);

})(window.angular);