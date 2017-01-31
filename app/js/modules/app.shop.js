;(function(angular) {'use strict';

//
// Define the Shop module (app.shop)  for controllers, services and models
// the app.shop module depend on app.config and take resources in shop/*.html 
angular.module('app.shop', [])
  .factory('shop',shopFactory);

/**
 * app.shop provides a model for interacting with Shop.
 * This service serves as a convenient wrapper for other related services.
 */
shopFactory.$inject=['config','$location','$rootScope','$route','$resource','api'];
function shopFactory(config, $location, $rootScope, $route,$resource, api){
  var defaultShop = {
    url:'',
    photo:{},
    options:{},
    available:{},
    address:{},
    info:{},
    account:{},
    faq:[]
  };

  //
  // this is the restfull backend for angular 
  var backend=$resource(config.API_SERVER+'/v1/shops/:urlpath/:action',
        {category:'@id', action:'@action'}, {
        update: {method:'POST'},
        delete: {method:'PUT'},
  });


  
  function checkimg(s){
      if(!s.photo){
        s.photo={fg:''};
      }
  }    

  
  var Shop = function(data) {
    angular.extend(this, defaultShop, data);
  };

  Shop.prototype.isAvailable=function () {
    return (this.status!==true&&this.available&&this.available.active==true)
  }

  //
  // REST api wrapper
  //

  Shop.prototype.query = function(filter,cb,err) {
    var shops, s,self=this, params={};
    angular.extend(params, filter);
    s=backend.query(params, function() {
      shops=self.wrapArray(s);
      if(cb)cb(shops);
    });
    return s;
  };

  Shop.prototype.findByCatalog = function(cat, filter,cb,err) {
    var shops, s,self=this;
    angular.extend(params, filter,{urlpath:'category',action:cat});      
    s=backend.query(filter, function() {
      shops=self.wrapArrayp(s);
      if(cb)cb(shops);
    });
    return shops;
  };


  Shop.prototype.get = function(urlpath,cb) {
    var self=this;      
    var s=backend.get({urlpath:urlpath},function() {
      checkimg(s);
      self.wrap(s);
      if(cb)cb(self);
    });
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
    if(!err) err=function(){};
    var me=this, s=backend.save({urlpath:this.urlpath},this, function() {
      $rootScope.$broadcast("shop.update",me);
      if(cb)cb(me.wrap(s));
    },err);
    return this;
  };

  Shop.prototype.create=function(user, data,cb){
    // if(!err) err=function(){};
    var me=this, s = backend.save(data, function() {
      var shop=me.wrap(s);
      user.shops.push(shop);
      if(cb)cb(shop);
    });
    return this;
  };    
  
  Shop.prototype.remove=function(user,password,cb,err){
    if(!err) err=function(){};
    var me=this, s = backend.delete({urlpath:this.urlpath},{password:password},function() {
      user.shops.pop(me);
      $rootScope.$broadcast("shop.remove",me);
      if(cb)cb(me);
    },err);
    return this;
  };    
  
  var _shops=api.wrapDomain(Shop, 'urlpath', defaultShop);
  return _shops;

}

})(window.angular);
