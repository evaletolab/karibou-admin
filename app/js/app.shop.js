'use strict';

//
// Define the Shop module (app.shop)  for controllers, services and models
// the app.shop module depend on app.config and take resources in shop/*.html 
var Shop=angular.module('app.shop', ['app.config', 'app.api']);

//
// define all routes for user api
Shop.config([
  '$routeProvider',
  '$locationProvider',
  '$httpProvider',

  function ($routeProvider, $locationProvider, $httpProvider) {

    // List of routes of the application
    $routeProvider
      .when('/shop/:shop/products',{redirectTo:'/shop/:shop'})
      .when('/shop/:shop', {title:'Votre boutique ', templateUrl : '/partials/shop/shop-content.html'});
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
  'product',

  function (config, $scope, $rootScope, $routeParams, $location, api, shop, product) {
    $scope.FormInfos=false;
    $scope.FormErrors=false;


    var cb_error=api.error($scope);

    $scope.config=config;
    $scope.shop=shop;
    
    $scope.save=function(shop){
      console.log(shop)
      shop.save(function(s){
          api.info($scope,"Votre boutique a été enregistrée!");
      },cb_error);
    };
    

    
    // init
    shop.get($routeParams.shop,function(shop){
      $scope.shop=shop;
      $rootScope.title='La boutique '+shop.name;
    },cb_error);
    

    //
    // ask for activation
    $scope.publish=function(){
      if($scope.waitingStatus())
        return;
      shop.publish(function(){
          api.info($scope,"Une demande d'activation à bien été envoyé! Vous serez contacté dans les plus brefs délais");        
      },cb_error);
    }

    //
    // upload foreground photo 
    $scope.uploadFgPhoto=function(shop){
      api.uploadfile($scope, {},function(err,fpfile){
        if(err){
          api.info($scope,err.toString());
          return false;
        }
        //
        // FIXME
        if(console)console.log("upload fg",shop)
        if (!shop.photo)shop.photo={};
        shop.photo.fg=fpfile.url;
        shop.save(function(s){
            api.info($scope,"Votre photo a été enregistrée!");
            //$('div.backstretch').remove();
            //$('#bgshop').backstretch(FPFile.url);
            
        },cb_error);
        
      });
    }
        
    //
    // upload owner photo 
    $scope.uploadOwnerPhoto=function(shop){
      api.uploadfile($scope, {},function(err,fpfile){
        if(err){
          api.info($scope,err.toString());
          return false;
        }
        var filter='/convert?w=260&fit=scale';
        //
        // FIXME
        if(console)console.log("upload ownner",shop)
        if (!shop.photo)shop.photo={};
        shop.photo.owner=fpfile.url+filter;
        shop.save(function(s){
            api.info($scope,"Votre photo a été enregistrée!");            
            //elem.find('img.photo-owner').attr("src",FPFile.url+filter);
            
        },cb_error);
        
      });
    }


    //
    // ask a question
    $scope.modal=function(target){
      angular.element('#ask').modal({backdrop:false});
    }
    $scope.ask=function(content){

      shop.ask(content, function(){
          api.info($scope,"Votre question à bien été envoyé! Vous serez contacté dans les plus brefs délais");        
          
      },cb_error);
    }
    
    $scope.waitingStatus=function(){
      return ((typeof shop.status)==='number')
    }
    
    //
    // get products for the front page shop
    var filter={sort:'created',group:'categories.name'/**,status:true*/};
    $scope.products=product.home($routeParams.shop, filter,function(products){
      $scope.products=products;
    });
    
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
  'api',
  
  function (config, $location, $rootScope, $route,$resource, api) {

 
    var defaultShop = {
      url:'',
      photo:{},
      options:{},
      available:{},
      info:{},
      faq:[]
    };
    
    function checkimg(s){
        if(!s.photo){
          s.photo={fg:config.shop.photo.fg};
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

    

    //
    // REST api wrapper
    //
    Shop.prototype.home = function(filter,cb,err) {
      if(!err) err=onerr;
      var shops, s, shop=this;
      s=$resource(config.API_SERVER+'/v1/shops',{},{cache:true}).get(filter, function() {
        shops={};
        for (var group in s){
          shops[group]=[];
          if (Array.isArray(s[group]) && typeof s[group][0]==="object"){
            s[group].forEach(function(inst){
              shops[group].push(shop.share(inst));
            });          
          }
        }
        if(cb)cb(shops);
      },err);
      return shops;
    };

    Shop.prototype.query = function(filter,cb,err) {
      if(!err) err=onerr;
      var shops, s,shop=this;
      s=$resource(config.API_SERVER+'/v1/shops/category').query(filter, function() {
        shops=shop.map(s);
        if(cb)cb(shops);
      },err);
      return shops;
    };

    Shop.prototype.findByCatalog = function(cat, filter,cb,err) {
      if(!err) err=onerr;
      var shops, s,shop=this;
      s=$resource(config.API_SERVER+'/v1/shops/category/:category',{category:cat}).query(filter, function() {
        shops=shop.map(s);
        if(cb)cb(shops);
      },err);
      return shops;
    };


    Shop.prototype.get = function(urlpath,cb,err) {
      if(!err) err=onerr;
      
      var me=this, loaded=Shop.find(urlpath);if (loaded){
        me.share(loaded,true)
        if(cb)cb(loaded);
        return loaded;
      };
      
      var s=$resource(config.API_SERVER+'/v1/shops/:urlpath',{urlpath:urlpath}).get( function() {
        checkimg(s);
        if(cb)cb(me.share(s,true));
      },err);
      return this;
    };

    Shop.prototype.publish=function(cb,err){
      if(!err) err=function(){};
      var me=this, s = $resource(config.API_SERVER+'/v1/shops/:urlpath/status',{urlpath:this.urlpath}).get(function() {
        if(cb)cb(me);
      },err);
      return this;
    };    

    Shop.prototype.ask=function(content, cb,err){
      if(!err) err=function(){};
      var me=this, s = $resource(config.API_SERVER+'/v1/shops/:urlpath/ask',{urlpath:this.urlpath}).save({content:content},function() {
        if(cb)cb(me);
      },err);
      return this;
    };    

    Shop.prototype.save = function( cb, err){
      if(!err) err=onerr;
      var me=this, s=$resource(config.API_SERVER+'/v1/shops/:urlpath',{urlpath:this.urlpath}).save(this, function() {
        if(cb)cb(me.share(s,true));
      },err);
      return this;
    };

    Shop.prototype.create=function(user, data,cb,err){
      if(!err) err=function(){};
      var me=this, s = $resource(config.API_SERVER+'/v1/shops').save(data, function() {
        var shop=me.share(s,true);
        user.shops.push(shop);
        if(cb)cb(shop);
      },err);
      return this;
    };    
    
    Shop.prototype.remove=function(user,cb,err){
      if(!err) err=function(){};
      var me=this, s = $resource(config.API_SERVER+'/v1/shops/:urlpath',{urlpath:this.urlpath}).delete(function() {
        user.shops.pop(me);
        if(cb)cb(me);
      },err);
      return this;
    };    
   
    return api.wrapDomain(Shop, 'urlpath', 'shops', defaultShop, onerr);  
  }
]);

