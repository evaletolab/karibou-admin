'use strict';

//
// Define the Category module (app.shop)  for controllers, services and models
// the app.shop module depend on app.config and take resources in shop/*.html 
var Category=angular.module('app.category', ['app.config', 'app.api', 'ui','ui.bootstrap']);

//
// define all routes for user api
Category.config([
  '$routeProvider',
  '$locationProvider',
  '$httpProvider',

  function ($routeProvider, $locationProvider, $httpProvider) {

    // List of routes of the application
    $routeProvider
      .when('/admin/category', {title:'Admin of category ', templateUrl : '/partials/admin/category.html'});
  }
]);


//
// Define the application level controllers
// the CategoryCtrl is used in shop/*.html 
Category.controller('CategoryCtrl',[
  'config',
  '$scope',
  '$rootScope',
  '$routeParams',
  '$location',
  'api',
  'category',
  '$resource',

  function (config, $scope, $rootScope, $routeParams, $location, api, category,$resource) {
    $scope.FormInfos=false;
    $scope.FormErrors=false;


    var cb_error=api.error($scope);

    $scope.config=config;
  
    $scope.selected;
    
    $scope.selectCategory=function(e,v){
      if(!$scope.categoryslug)return;
      category.get($scope.categoryslug,function(c){
        $scope.selected=c;        
      });
    };
  
    $scope.save=function(category){
      category.save(function(s){
          api.info($scope,"Successfully updated!");
          $scope.categoryslug=null;
      },cb_error);
    };
    
    $scope.create=function(cat){
      category.create(cat,function(s){
          api.info($scope,"Successfully updated!");
          $scope.categories.push(s);
      },cb_error);
    };
    $scope.delete=function(category){
      $scope.categoryslug=false;
      category.remove(function(s){
          api.info($scope,"Successfully updated!");
          $scope.categories.pop(s);
      },cb_error);
    };

    
    // init
    category.select({},function(categories){
      $scope.categories=categories;
    },cb_error);
    
  }  
]);



/**
 * app.shop provides a model for interacting with Category.
 * This service serves as a convenient wrapper for other related services.
 */

Category.factory('category', [
  'config',
  '$location',
  '$rootScope',
  '$route',
  '$resource',
  'api',

  function (config, $location, $rootScope, $route,$resource, api) {

 
    var defaultCategory = {
      name:'',
      description:"",
      group:""
    };
    
    //
    // default behavior on error
    var onerr=function(data,config){
      _category.copy(defaultCategory);
    };
    
    var Category = function(data) {
      angular.extend(this, defaultCategory, data);
    }
    
    Category.findNameBySlug = function(slug){
      var cat=this.find({slug:slug});
      if (cat) return cat.name; else return "Inconnu";      
    };

    Category.findBySlug = function(slug){
      return this.find({slug:slug});
    };

    Category.prototype.select = function(filter,cb,err) {
      if(!err) err=onerr;
      var categories=[];
      var c=$resource(config.API_SERVER+'/v1/category').query(filter, function() {
        categories=Category.load(c);
        if(cb)cb(categories);
      },err);
      return categories;
    };


    Category.prototype.get = function(slug,cb,err) {
      if(!err) err=onerr;
      var loaded=Category.find({slug:slug});if (loaded){
        if(cb)cb(loaded);
        return loaded;
      }
      
      var category=this, c=$resource(config.API_SERVER+'/v1/category/:category',{category:slug}).get( function() {
        category.share(s,true);
        if(cb)cb(category);
      },err);
      return category;
    };


    Category.prototype.save = function(cb, err){
      //console.log("model",this.photo)

      if(!err) err=onerr;
      var category=this, s=$resource(config.API_SERVER+'/v1/category/:category',{category:this.slug}).save(this, function() {
        category.share(s,true);
        if(cb)cb(category);
      },err);
      return category;
    };

    Category.prototype.create=function(cat, cb,err){
      if(!err) err=function(){};
      var category=this, s = $resource(config.API_SERVER+'/v1/category').save(cat, function() {
        category=category.share(s,true);
        if(cb)cb(category);
      },err);
      return category;
    };    
    
    Category.prototype.remove=function(cb,err){
      if(!err) err=function(){};
      var category=this, s = $resource(config.API_SERVER+'/v1/category/:category',{category:this.slug}).delete(function() {
        if(cb)cb(category);
      },err);
      return category;
    };    
   
    return api.wrapDomain(Category,'slug', 'category', defaultCategory, onerr);  


  }
]);

