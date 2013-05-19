'use strict';

//
// Define the Home module (app.home)  for controllers, services and models
var Home=angular.module('app.home', ['app.config','app.user','app.shop', 'app.api']);


//
// define all routes for user api
Home.config([
  '$routeProvider',
  '$locationProvider',
  '$httpProvider',

  function ($routeProvider, $locationProvider, $httpProvider) {

    // List of routes of the application
    $routeProvider
      .when('/', {title:'welcome to your open community market', templateUrl : '/partials/shop/home.html'})
      .when('/products', {title:'Les produits ', templateUrl : '/partials/product/home.html'})
      .when('/products/:sku', {title:'Votre produit ', templateUrl : '/partials/product/home.html'})
      .when('/products/category/:category', {title:'Les produits ', templateUrl : '/partials/product/products.html'})
      .when('/shops/category/:catalog', {title:'Les boutiques ', templateUrl : '/partials/shop/shops.html'});
  }
]);

//
// the HomeCtrl is used in home.html (see app/assets/home.html)
Home.controller('HomeCtrl', [
  '$scope',
  '$location',
  '$rootScope',
  '$routeParams',
  'config',
  'api',
  'category',
  'user',
  'shop',
  'product',

  function ($scope, $location, $rootScope, $routeParams, config, api, category, user, shop, product) {
    var filter={};
    $scope.user = user;
    $scope.FormInfos=false;
    $scope.FormErrors=false;
    
    

    // redirect to load product
    $rootScope.$emit(($routeParams.sku)?'on-display-product':'on-hide-product',$routeParams.sku, 'home');    

    //
    // list products by category
    if ($routeParams.category){
      $scope.group=category.constructor.findNameBySlug($routeParams.category);
      $scope.$parent.title="Les produits - "+$scope.group;
      filter={sort:'title'};
      
      $scope.products=product.findByCategory($routeParams.category,filter,function(products){
        $scope.products=products;
      });
      return;
    }
    
    //
    // list shops by catalog
    if($routeParams.catalog){
      $scope.group=category.constructor.findNameBySlug($routeParams.catalog);
      $scope.$parent.title="Les boutiques - "+$scope.group;
      filter={sort:'location'};
      
      $scope.shops=shop.findByCatalog($routeParams.catalog,filter,function(shops){
        $scope.shops=shops;
      });
      return;
    }
    
    if($location.path()==='/products'||$routeParams.sku){
      filter={sort:'title',group:'categories.name' /*,valid:true*/};
      $scope.products=product.home(null, filter,function(products){
        $scope.products=products;
      });
      return;
    }
    
    //
    // get shops for the front page
    filter={sort:'location',group:'catalog.name' /*,valid:true*/};
    $scope.shops=shop.home(filter,function(shops){
      $scope.shops=shops;
    });
    
        
  }
]);

  
 
