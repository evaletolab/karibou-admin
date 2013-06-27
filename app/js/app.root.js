'use strict';

//
// Define the application level controllers
angular.module('app.root', [
  'app.config',
  'app.user',
  'ui',
  'ui.bootstrap'
])

//
// the AppCtrl is used in index.html (see app/assets/index.html)
.controller('AppCtrl', [
  '$scope',
  '$rootScope',
  '$location',
  'config',
  'api',
  'user',
  'category',
  'product',

  function ($scope, $rootScope,  $location, config, api, user, category, product) {


    var cb_error=api.error($scope);

    $scope.user = user;
    $scope.categories = [];

    //
    // check and init the session    
    user.me(function(u){
      $scope.user = u;
      // dont use error callback, you will lloose anonymous setting
    });

    
    //
    // get categories
    category.select({},function(categories){
      $scope.category=category;
    },cb_error);


    //
    // get the head title up2date 
    $rootScope.$on('$routeChangeSuccess', function (event, current, previous) {
      if (!user.isAuthenticated()){
        if(_.find(['/admin'],function(path){
          return ($location.path().indexOf(path)===0);
        })){
          $location.path('/login');
        }
      }

      $rootScope.title = (current.$route.title)?current.$route.title:current.$route.templateUrl;
    });



    // Uses the url to determine if the selected
    // menu item should have the class active.
    $scope.$location = $location;
    $scope.$watch('$location.path()', function (path) {
      $scope.activeNavId = path || '/';
    });

    // getClass compares the current url with the id.
    // If the current url starts with the id it returns 'active'
    // otherwise it will return '' an empty string. E.g.
    //
    //  // current url is '/products/1'
    //  getClass('/products'); // returns 'active'
    //  getClass('/orders'); // returns ''
    $scope.getClass = function (id) {
      if ($scope.activeNavId&&$scope.activeNavId.substring(0, id.length) === id && id.length === $scope.activeNavId.length) {
        return 'active';
      }
      return '';
    };
   
    
    //
    // logout (global function)
    $scope.logout=function(){
      user.logout(function(user){
        $scope.user=user;
        $location.url('/');
      });
    };

    //
    // the size of shop and product cart
    $scope.getFormat=function(index){      
      if (index===undefined) return 'c2';
      return (!index)?"c3":"c2";
    }    

    
  }
]);

  
  



