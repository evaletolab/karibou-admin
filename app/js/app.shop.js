'use strict';

//
// Define the Shop module (app.shop)  for controllers, services and models
// the app.shop module depend on app.config and take resources in shop/*.html 
var Shop=angular.module('app.shop', ['app.config', 'app.api','app.shop.ui', 'ui','ui.bootstrap']);

//
// define all routes for user api
Shop.config([
  '$routeProvider',
  '$locationProvider',
  '$httpProvider',

  function ($routeProvider, $locationProvider, $httpProvider) {

    // List of routes of the application
    $routeProvider
      .when('/shop/:shop', {title:'Votre boutique ', templateUrl : '/partials/shop/index.html'});
  }
]);


//
// Define the application level controllers
// the ShopCtrl is used in shop/*.html 
Shop.controller('ShopCtrl',[
  'config',
  '$scope',
  '$rootScope',
  '$routeParams',
  '$location',
  'api',
  'shop',
  '$resource',

  function (config, $scope, $rootScope, $routeParams, $location, api, shop,$resource) {
    $scope.FormInfos=false;
    $scope.FormErrors=false;


    var cb_error=api.error($scope);

    $scope.config=config;
  
    $scope.save=function(shop){
      //console.log("controller",shop.photo)
      shop.save(function(s){
          $scope.FormInfos="Your shop is successfully updated!";
      },cb_error);
    };
    

    
    // init
    shop.get($routeParams.shop,function(shop){
      $scope.shop=shop;
      $rootScope.title='La boutique '+shop.name;
    },cb_error);
    
  }  
]);



/**
 * app.shop provides a model for interacting with Shop.
 * This service serves as a convenient wrapper for other related services.
 */

Shop.factory('shop', [
  'config',
  '$location',
  '$rootScope',
  '$route',
  '$resource',

  function (config, $location, $rootScope, $route,$resource) {

 
    var defaultShop = {
      url:'',
      options:{},
      available:{},
      info:{},
      faq:[]
    };
    
    function checkimg(s){
        if(!s.photo){
          s.photo={fg:config.shop.photo.fg};
        }
        if(!s.photo.owner){
          //s.photo.owner=config.shop.photo.owner;
        }
    }    
    //
    // default behavior on error
    var onerr=function(data,config){
      _shop.copy(defaultShop);
    };
    
    var Shop = function(data) {
      angular.extend(this, defaultShop, data);
    }

    Shop.prototype.copy = function(data) {
        angular.extend(this,defaultShop, data);
    };


    //
    // REST api wrapper
    //


    Shop.prototype.query = function(valid,cb,err) {
      if(!err) err=onerr;
      var shops=[];
      var s=$resource(config.API_SERVER+'/v1/shops').query({valid:valid}, function() {
        s.forEach(function(shop){
          checkimg(shop);
          shops.push(_share(shop));
        });
        if(cb)cb(shops);
      },err);
      return shops;
    };


    Shop.prototype.get = function(urlpath,cb,err) {
      if(!err) err=onerr;
      var s=$resource(config.API_SERVER+'/v1/shops/:urlpath',{urlpath:urlpath}).get( function() {
        checkimg(s);
        _share(s);        
        _shop.copy(s);
        if(cb)cb(_shop);
      },err);
      return _shop;
    };


    Shop.prototype.save = function( cb, err){
      //console.log("model",this.photo)

      if(!err) err=onerr;
      //return _shop;
      var s=$resource(config.API_SERVER+'/v1/shops/:urlpath',{urlpath:this.urlpath}).save(this, function() {
        _share(s);        
        _shop.copy(s);
        if(cb)cb(_shop);
      },err);
      return _shop;
    };

    Shop.prototype.create=function(user, shop,cb,err){
      if(!err) err=function(){};
      var s = $resource(config.API_SERVER+'/v1/shops').save(shop, function() {
        user.shops.push(s);
        _share(s);        
        _shop.copy(s);
        if(cb)cb(_shop);
      },err);
      return _shop;
    };    
    
    Shop.prototype.remove=function(user,cb,err){
      if(!err) err=function(){};
      var s = $resource(config.API_SERVER+'/v1/shops/:urlpath',{urlpath:this.urlpath}).delete(function() {
        user.shops.pop(this);
        if(cb)cb(_shop);
      },err);
      return _shop;
    };    
   
    function _share(shop){
      if(!_all[shop.urlpath])_all[shop.urlpath]=new Shop();
      _all[shop.urlpath].copy(shop);
      return _all[shop.urlpath];
    }
    //
    //default singleton for user  
    var     _shop=new Shop({});
    var     _all={};
    return _shop;  


  }
]);

