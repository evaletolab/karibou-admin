;(function(angular) {'use strict';

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
      .when('/shop/:shop/edit',{title:'Editer votre boutique ', templateUrl : '/partials/shop/edit.html'})
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
  'Map',
  '$log',

  function (config, $scope, $rootScope, $routeParams, $location, api, shop, product, Map,$log) {

    $scope.config=config;
    $scope.shop=shop;
    $scope.map=new Map();
    
    $scope.save=function(shop){
      shop.save(function(s){
          //
          // inform all listeners this has changed
          $rootScope.$broadcast("update.shop",shop);
          api.info($scope,"Votre boutique a été modifié!",2000,function(){
            $location.url('/shop/'+shop.urlpath);            
          });
      });
    };
    
    $scope.remove=function(user,shops,password){
      shop.remove(user,password,function(){
          api.info($scope,"Votre boutique a été définitivement supprimée!",2000,function(){
            $location.url('/account');  
            user.shops.pop(shop)          
          });
      });
    }

    
    // init
    shop.get($routeParams.shop,function(shop){
      $scope.shop=shop;
      $rootScope.title='La boutique '+shop.name;
    });
    

    //
    // ask for activation
    $scope.publish=function(){
      if($scope.waitingStatus())
        return;
      shop.publish(function(){
          api.info($scope,"Une demande d'activation à bien été envoyée! Vous serez contacté dans les plus brefs délais");        
      });
    }

    //
    // upload foreground photo 
    $scope.uploadFgPhoto=function(shop){
      api.uploadfile($scope, {},function(err,fpfile){
        if(err){
          api.info($scope,"l'opération à été anullé");
          return false;
        }
        //
        // FIXME
        $log.info("upload fg",shop,fpfile,err,shop.photo)
        if (!shop.photo)shop.photo={};
        shop.photo.fg=fpfile.url;
        shop.photo.fg=(config.storage&&fpfile.key)?config.storage+fpfile.key:fpfile.url;      
        shop.save(function(s){
            api.info($scope,"Votre photo a été enregistrée!");            
        });
        
      });
    }
        
    //
    // upload owner photo 
    $scope.uploadOwnerPhoto=function(shop){
      api.uploadfile($scope, {},function(err,fpfile){
        if(err){
          api.info($scope,"l'opération à été anullé");
          return false;
        }
        var filter='/convert?w=260&fit=scale';
        //
        // FIXME
        if(console)console.log("upload ownner",shop)
        if (!shop.photo)shop.photo={};
        shop.photo.owner=fpfile.url+filter;
        shop.photo.owner=(config.storage&&fpfile.key)?config.storage+fpfile.key:fpfile.url;      
        shop.save(function(s){
            api.info($scope,"Votre photo a été enregistrée!");            
            //elem.find('img.photo-owner').attr("src",FPFile.url+filter);
            
        });
        
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
          
      });
    }
    
    $scope.waitingStatus=function(){
      return ((typeof shop.status)==='number')
    }

    $scope.activeMarket=function(m){
      return (shop.marketplace&&(shop.marketplace.indexOf(m)>-1));
    }
    
    $scope.toggleMarket=function(m){
      var idx=shop.marketplace.indexOf(m)
      if(idx>-1)
        shop.marketplace.splice(idx,1);
      else
        shop.marketplace.push(m)
    }


    //
    // geomap init
    $scope.updateMap=function(address){
      if (address.streetAdress===undefined||address.postalCode===undefined)
       return;
      $scope.map.geocode(address.streetAdress, address.postalCode, address.country, function(geo){
        if(!geo.results.length||!geo.results[0].geometry){
         return;
        }
        //
        //update data
        address.geo={};
        address.geo.lat=geo.results[0].geometry.location.lat;
        address.geo.lng=geo.results[0].geometry.location.lng;
        //
        // map init
        var fullAddress=address.streetAdress+'/'+address.postalCode;
        $scope.map.addMarker(1, {lat:address.geo.lat,lng:address.geo.lng, message:fullAddress});
        // angular.extend($scope,map.getMap());

      })
    };    

    //
    // get products for the front page shop
    var filter={sort:'categories.weight',group:'categories.name', available:true};
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
      address:{},
      info:{},
      faq:[]
    };
    
    function checkimg(s){
        if(!s.photo){
          s.photo={fg:''};
        }
    }    
    
    var Shop = function(data) {
      //
      // this is the restfull backend for angular 
      this.backend=$resource(config.API_SERVER+'/v1/shops/:urlpath/:action',
            {category:'@id', action:'@action'}, {
            update: {method:'POST'},
            delete: {method:'PUT'},
      });

      angular.extend(this, defaultShop, data);
    }

    //
    // default behavior on error
    Shop.prototype.onerr=function(data,config){
      this.copy(defaultShop);
    };    
    

    //
    // REST api wrapper
    //
    Shop.prototype.home = function(filter,cb,err) {
      if(!err) err=this.onerr;
      var shops, s, self=this;
      s=this.backend.get(filter, function() {
        shops={};
        for (var group in s){
          shops[group]=[];
          if (Array.isArray(s[group]) && typeof s[group][0]==="object"){
            shops[group]=self.wrapArray(s[group])
          }
        }
        if(cb)cb(shops);
      },err);
      return shops;
    };

    Shop.prototype.query = function(filter,cb,err) {
      if(!err) err=this.onerr;
      var shops, s,self=this, params={};
      angular.extend(params, filter)
      s=this.backend.query(params, function() {
        shops=self.wrapArray(s);
        if(cb)cb(shops);
      },err);
      return s;
    };

    Shop.prototype.findByCatalog = function(cat, filter,cb,err) {
      if(!err) err=this.onerr;
      var shops, s,self=this;
      angular.extend(params, filter,{urlpath:'category',action:cat})      
      s=this.backend.query(filter, function() {
        shops=self.wrapArrayp(s);
        if(cb)cb(shops);
      },err);
      return shops;
    };


    Shop.prototype.get = function(urlpath,cb) {
      var err=this.onerr, self=this;      
      var s=this.backend.get({urlpath:urlpath},function() {
        checkimg(s);
        self.wrap(s)
        if(cb)cb(self);
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
      if(!err) err=this.onerr;
      var me=this, s=this.backend.save({urlpath:this.urlpath},this, function() {
        if(cb)cb(me.wrap(s));
      },err);
      return this;
    };

    Shop.prototype.create=function(user, data,cb){
      // if(!err) err=function(){};
      var me=this, s = this.backend.save(data, function() {
        var shop=me.wrap(s);
        user.shops.push(shop);
        if(cb)cb(shop);
      });
      return this;
    };    
    
    Shop.prototype.remove=function(user,password,cb,err){
      if(!err) err=function(){};
      var me=this, s = this.backend.delete({urlpath:this.urlpath},{password:password},function() {
        user.shops.pop(me);
        if(cb)cb(me);
      },err);
      return this;
    };    
   
    return api.wrapDomain(Shop, 'urlpath', defaultShop);  
  }
]);

})(window.angular);
