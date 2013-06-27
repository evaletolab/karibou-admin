'use strict';

//
// Define the Product module (app.product)  for controllers, services and models
// the app.product module depend on app.config and take resources in product/*.html 
var Product=angular.module('app.product', ['app.config', 'app.api']);


//
// define all routes for user api
Product.config([
  '$routeProvider',
  '$locationProvider',
  '$httpProvider',

  function ($routeProvider, $locationProvider, $httpProvider) {

    // List of routes of the application
    $routeProvider
      .when('/products/create', {
          title:'Créer un nouveau produit ',clear:true, modal:true, view:'modal',controller:'ProductCtrl', templateUrl : '/partials/product/create.html'
       })
      .when('/products/:sku', {
          title:'Votre produit ', modal:true,view:'modal',controller:'ProductCtrl', templateUrl : '/partials/product/product-wide.html'
       })
      .when('/products/:sku/edit', {
          title:'Votre produit ', modal:true,view:'modal',controller:'ProductCtrl', templateUrl : '/partials/product/create.html'
       })
      .when('/shop/:shop/products/:sku', {
          title:'Votre produit ', modal:true,view:'modal',controller:'ProductCtrl', templateUrl : '/partials/product/product-wide.html'
       });
  }
]);



Product.controller('ProductCtrl',[
  '$scope',
  '$route',
  '$location',
  '$routeParams',
  'config',
  'api',
  'product',

  function ($scope,$route, $location, $routeParams, config, api, product) {
    $scope.FormInfos=false;
    $scope.FormErrors=false;
    $scope.product=product;

    var cb_error=api.error($scope);

    $scope.config=config;
  
    $scope.save=function(product){
      product.save(function(s){
          api.info($scope,"Votre produit a été enregistrée!",2000, function(){
            $location.path("/products/"+product.sku)
          });
      },cb_error);
    };
    
    if($route.current&&$route.current.$route.clear){
      $scope.product={};
    }
    
    
    $scope.create=function(shop,p){
      if (!shop){
        return api.info($scope,"Vous devez préciser la boutique");
      }
      product.create(shop,p,function(product){
          $location.path("/products/"+product.sku)
          $scope.product=product;
      },cb_error);
      
    };

    $scope.remove=function(product){
      product.remove(function(){
          $location.path("/products")
          $scope.product={};
      },cb_error);
      
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
    
    $scope.productDetails=function(){
      var detail="", coma;
      if (product.details.bio) {
        coma=detail="bio";        
      }
      /**
      if (product.details.gluten){ 
        if(coma)detail+=", "
        detail+="sans gluten";
      }
      */
      return detail;
    }    
    
    
    

    if($routeParams.sku){
      product.get($routeParams.sku,function(product){
        $scope.title='products '+product.sku+' - '+product.title;
        $scope.product=product;
        if(product.attributes.comment)loadDisqus($location.path());
      },cb_error);
    }          
    
          
    function loadDisqus(currentPageId) {
      // http://docs.disqus.com/help/2/
      window.disqus_shortname = 'karibou';
      window.disqus_identifier = currentPageId;

      if ($location.host() == 'localhost') {
        window.disqus_developer = 1;
      }

      // http://docs.disqus.com/developers/universal/
      (function() {
        var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;
        dsq.src = 'http://karibou.disqus.com/embed.js';
        (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
      })();

      angular.element(document.getElementById('disqus_thread')).html('');
    }    
      
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
      details:{},
      attributes:{
        available:true
      }
    };
    
    //
    // default behavior on error
    var onerr=function(data,config){
      //FIXME on error reset product
      //_product.copy(defaultProduct);
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
      
      var loaded=Product.find(sku);if (loaded){
        if(cb)cb(loaded);
        return loaded;
      };
      
      var product=this, s=$resource(config.API_SERVER+'/v1/products/:sku',{sku:sku}).get( function() {
        if(cb)cb(product.share(s,true));
      },err);
      return this;
    };


    Product.prototype.save = function( cb, err){
      if(!err) err=onerr;
      var product=this, s=$resource(config.API_SERVER+'/v1/products/:sku',{sku:this.sku}).save(this, function() {
        console.log(s)
        if(cb)cb(product.share(s,true));
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
    
    Product.prototype.remove=function(cb,err){
      if(!err) err=function(){};
      var product=this, s = $resource(config.API_SERVER+'/v1/products/:sku',{sku:this.sku}).delete(function() {
        if(cb)cb(product);
      },err);
      return this;
    };    
   
    return api.wrapDomain(Product, 'sku', 'products', defaultProduct, onerr);  
  }
]);

