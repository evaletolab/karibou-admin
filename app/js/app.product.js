'use strict';

//
// Define the Product module (app.product)  for controllers, services and models
// the app.product module depend on app.config and take resources in product/*.html 
var Product=angular.module('app.product', ['app.config', 'app.api','app.product.ui', 'ui','ui.bootstrap']);

function ProductCtrl($routeParams, $location) {
  console.log($routeParams, $location)
}
//
// define all routes for user api
Product.config([
  '$routeProvider',
  '$locationProvider',
  '$httpProvider',

  function ($routeProvider, $locationProvider, $httpProvider) {

    // List of routes of the application
    $routeProvider
      .when('/productss/:sku', {title:'Votre produit ',reloadOnSearch:false, controller:'ProductCtrl',_templateUrl : '/partials/product/home.html'});
  }
]);



Product.controller('ProductCtrl',[
  '$scope',
  '$route',
  '$rootScope',
  '$routeParams',
  'config',
  'api',
  'product',

  function ($scope,$route, $rootScope, $routeParams, config, api, product) {
    $scope.FormInfos=false;
    $scope.FormErrors=false;

    //console.log($route,$routeParams)
    var cb_error=api.error($scope);

    $scope.config=config;
  
    $scope.save=function(product){
      product.save(function(s){
          api.info($scope,"Votre produit a été enregistrée!",2000, function(){
            $('#close-product-editor').click();
          });
      },cb_error);
    };
    
    $scope.create=function(shop,p){
      if (!shop ||!p){
        return api.info($scope,"Ooops");
      }
      product.create(shop,p,function(product){
          api.info($scope,"Votre produit à été crée ",2000, function(){
            $('#close-product-editor').click();
          });
          $scope.product={};
      },cb_error);
      
    };

    
    // init
    /**
    product.get($routeParams.product,function(product){
      $scope.product=product;
      $rootScope.title=product.sku+' - '+product.name;
    },cb_error);
    */
    

    $scope.$on("edit-product",function(e,id,p){
      $scope.openProductEditor(id,p);
    });
    
    
    $scope.openProductEditor = function(id,p){
      var options = {
        backdrop: true,
        keyboard: true,
        backdropClick: true,
        templateUrl:  "/partials/product/create.html", 
        _controller: 'ProductCtrl'
      };

      $rootScope.product=(p)?p:product;
      $(id).modal('show');
    };

    $scope.uploadImage=function(product, imgKey){
      api.uploadfile({},function(err,fpfile){
        if(err){
          api.info($scope,err.toString());
          return false;
        }
        product.photo=fpfile.url;
        
      });
      return false;
    }
    
    //$rootScope.product=product;
    
    $rootScope.$on('on-hide-product',function(e,sku,from){
      $rootScope.product={};
    });
    
    $rootScope.$on('on-display-product',function(e,sku,from){
      product.get(sku,function(product){
        $rootScope.title='/products/'+product.sku+' - '+product.title;
        $rootScope.product=product;
      },cb_error);

    });

    //console.log($routeParams)
    
    
  }  
]);



/**
 * app.product provides a model for interacting with Product.
 * This service serves as a convenient wrapper for other related services.
 */

Product.factory('product', [
  'config',
  '$location',
  '$route',
  '$resource',
  'api',

  function (config, $location, $route,$resource,api) {

 
    var defaultProduct = {
      image:'',
      categories:[],
      details:{}
    };
    
    //
    // default behavior on error
    var onerr=function(data,config){
      _product.copy(defaultProduct);
    };
    
    var Product = function(data) {
      angular.extend(this, defaultProduct, data);
    }



    //
    // REST api wrapper
    //
    
    Product.prototype.home = function(shop,filter,cb,err) {
      if(!err) err=onerr;
      var products, s, product=this, path='/v1/shops/:shopname/products', params={shopname:shop};
      if(!shop){
        path='/v1/products';
        params={}
      }
      s=$resource(config.API_SERVER+path,params,{cache:true}).get(filter, function() {
        products={};
        for (var group in s){
          products[group]=[];
          if (Array.isArray(s[group]) && typeof s[group][0]==="object"){
            s[group].forEach(function(inst){
              products[group].push(product.share(inst));
            });          
          }
        }
        if(cb)cb(products);
      },err);
      return products;
    };

    
    Product.prototype.query = function(filter,cb,err) {
      if(!err) err=onerr;
      var products, s,product=this;
      s=$resource(config.API_SERVER+'/v1/products/category').query(filter, function() {
        products=product.map(s);
        if(cb)cb(products);
      },err);
      return products;
    };

    Product.prototype.findByCategory = function(cat, filter,cb,err) {
      if(!err) err=onerr;
      var products, s,product=this;
      s=$resource(config.API_SERVER+'/v1/products/category/:category',{category:cat}).query(filter, function() {
        products=product.map(s);
        if(cb)cb(products);
      },err);
      return products;
    };


    Product.prototype.get = function(sku,cb,err) {
      if(!err) err=onerr;
      var product=this, s=$resource(config.API_SERVER+'/v1/products/:sku',{sku:sku}).get( function() {
        if(cb)cb(product.share(s,true));
      },err);
      return this;
    };


    Product.prototype.save = function( cb, err){
      if(!err) err=onerr;
      var product=this, s=$resource(config.API_SERVER+'/v1/products/:sku',{sku:this.sku}).save(this, function() {
        if(cb)cb(product.share(s));
      },err);
      return this;
    };

    Product.prototype.create=function(shop, p,cb,err){
      if(!err) err=function(){};
      var product=this, s = $resource(config.API_SERVER+'/v1/shops/:shopname/products',{shopname:shop}).save(p, function() {
        product.share(s,true);
        if(cb)cb(product);
      },err);
      return this;
    };    
    
    Product.prototype.remove=function(user,cb,err){
      if(!err) err=function(){};
      var product=this, s = $resource(config.API_SERVER+'/v1/products/:sku',{sku:this.sku}).delete(function() {
        if(cb)cb(product);
      },err);
      return this;
    };    
   
    return api.wrapDomain(Product, 'sku', 'products', defaultProduct, onerr);  
  }
]);

