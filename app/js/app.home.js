'use strict';

//
// Define the Home module (app.home)  for controllers, services and models
var Home=angular.module('app.home', ['app.config','app.user','app.shop', 'app.api']);


//
// the HomeCtrl is used in home.html (see app/assets/home.html)
Home.controller('HomeCtrl', [
  '$scope',
  '$location',
  'config',
  'user',
  'shop',
  '$resource',

  function ($scope, $location, config, user,shop, $resource) {

    $scope.user = user;
    
    //
    // get shops for the front page
    $scope.shops=shop.query(true,function(shops){
      //$scope.shops=shops;
    });
        
  }
]);

  
 
