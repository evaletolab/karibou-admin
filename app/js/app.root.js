'use strict';

//
// Define the application level controllers
angular.module('app.root', [
  'app.config',
  'app.user'
])

//
// the AppCtrl is used in index.html (see app/assets/index.html)
.controller('AppCtrl', [
  '$scope',
  '$rootScope',
  '$location',
  'config',
  'user',

  function ($scope, $rootScope, $location, config, user) {


    $scope.user = user;

    //
    // check and init the session    
    user.me(function(u){
      $scope.user = u;
    });
    
    
    //
    // get the head title up2date 
    $rootScope.$on('$routeChangeSuccess', function (event, current, previous) {
        $rootScope.title = (current.$route.title)?current.$route.title:current.$route.templateUrl;
    });


    // 'rpc.status' is a channel used to broadcast messages. It's defined in rpc/services.js
    $scope.$on('rpc.status', function (e, d) {
      if (d === 'waiting') {
        $scope.WaitText = 'Working...';
      } else {
        $scope.WaitText = false;
      }
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
      if ($scope.activeNavId.substring(0, id.length) === id) {
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
    
  }
]);

  
  



