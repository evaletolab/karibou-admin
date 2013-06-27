'use strict';

//
// Define the Order module (app.shop)  for controllers, services and models
// the app.shop module depend on app.config and take resources in shop/*.html 
var Order=angular.module('app.order', ['app.config', 'app.api','google-maps', 'ui','ui.bootstrap']);

//
// define all routes for user api
Order.config([
  '$routeProvider',
  '$locationProvider',
  '$httpProvider',

  function ($routeProvider, $locationProvider, $httpProvider) {

    // List of routes of the application
    $routeProvider
      .when('/shipping', {title:'welcome to your open community market',  templateUrl : '/partials/shipping/home.html'})
      .when('/admin/order', {title:'Admin of order ', _view:'main', templateUrl : '/partials/admin/order.html'});
  }
]);


//
// Define the application level controllers
// the OrderCtrl is used in shop/*.html 
Order.controller('OrderCtrl',[
  'config',
  '$scope',
  '$rootScope',
  '$routeParams',
  '$location',
  'api',
  'order',
  '$resource',
  '$log',

  function (config, $scope, $rootScope, $routeParams, $location, api, order,$resource, $log) {
    var cb_error=api.error($scope);

    $scope.config=config;
    $scope.order=order;
    google.maps.visualRefresh = true;
    
    // init
    // http://nominatim.openstreetmap.org/
    angular.extend($scope, {
      /** the initial center of the map */
      centerProperty: {
       latitude:46.196735,
       longitude:6.144748
      },
      /** the initial zoom level of the map */
      zoomProperty: 13,

      /** list of markers to put in the map */
      markersProperty: [ 
        {latitude:46.1995999,longitude:6.169193},
        {latitude: 46.2007628,longitude:6.1370923},
        {latitude:46.2095992,longitude:6.1478366},
        {latitude:46.206435,longitude:6.144448},
        {latitude:46.205535,longitude:6.144548},
        {latitude:46.185635,longitude:6.144648},
        {latitude:46.186735,longitude:6.145748},
        {latitude:46.196835,longitude:6.144848},
      ],
 
      // These 2 properties will be set when clicking on the map
      clickedLatitudeProperty: null,   
      clickedLongitudeProperty: null,
      
      eventsProperty: {
        click: function (mapModel, eventName, originalEventArgs) {	
          // 'this' is the directive's scope
          console.log("user defined event on map directive with scope", this);
          console.log("user defined event: " + eventName, mapModel, originalEventArgs);
        }
      }      
    });
    
    console.log(order,$scope)
    
  }  
]);



/**
 * app.shop provides a model for interacting with Order.
 * This service serves as a convenient wrapper for other related services.
 */

Order.factory('order', [
  'config',
  '$location',
  '$rootScope',
  '$route',
  '$resource',
  'api',

  function (config, $location, $rootScope, $route,$resource, api) {

 
    var defaultOrder = {
      name:'',
      description:"",
      group:""
    };
    
    //
    // default behavior on error
    var onerr=function(data,config){
      _order.copy(defaultOrder);
    };
    
    var Order = function(data) {
      angular.extend(this, defaultOrder, data);
    }
    
    Order.findNameBySlug = function(slug){
      var cat=this.find({slug:slug});
      if (cat) return cat.name; else return "Inconnu";      
    };

    Order.findBySlug = function(slug){
      return this.find({slug:slug});
    };

    Order.prototype.select = function(filter,cb,err) {
      if(!err) err=onerr;
      var categories=[];
      var c=$resource(config.API_SERVER+'/v1/order').query(filter, function() {
        categories=Order.load(c);
        if(cb)cb(categories);
      },err);
      return categories;
    };


    Order.prototype.get = function(slug,cb,err) {
      if(!err) err=onerr;
      var loaded=Order.find({slug:slug});if (loaded){
        if(cb)cb(loaded);
        return loaded;
      }
      
      var order=this, c=$resource(config.API_SERVER+'/v1/order/:order',{order:slug}).get( function() {
        order.share(s,true);
        if(cb)cb(order);
      },err);
      return order;
    };


    Order.prototype.save = function(cb, err){
      //console.log("model",this.photo)

      if(!err) err=onerr;
      var order=this, s=$resource(config.API_SERVER+'/v1/order/:order',{order:this.slug}).save(this, function() {
        order.share(s,true);
        if(cb)cb(order);
      },err);
      return order;
    };

    Order.prototype.create=function(cat, cb,err){
      if(!err) err=function(){};
      var order=this, s = $resource(config.API_SERVER+'/v1/order').save(cat, function() {
        order=order.share(s,true);
        if(cb)cb(order);
      },err);
      return order;
    };    
    
    Order.prototype.remove=function(cb,err){
      if(!err) err=function(){};
      var order=this, s = $resource(config.API_SERVER+'/v1/order/:order',{order:this.slug}).delete(function() {
        if(cb)cb(order);
      },err);
      return order;
    };    
    var _order=api.wrapDomain(Order,'slug', 'order', defaultOrder, onerr); 
    return _order; 


  }
]);

