'use strict';

//
// Define the Product module (app.product)  for controllers, services and models
// the app.product module depend on app.config and take resources in product/*.html 
var Product=angular.module('app.product', ['app.config', 'app.api','app.ui']);


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
          title:'Votre produit ', modal:true, edit:true, view:'modal',controller:'ProductCtrl', templateUrl : '/partials/product/create.html'
       })
      .when('/shop/:shop/products/:sku', {
          title:'Votre produit ', modal:true,view:'modal',controller:'ProductCtrl', templateUrl : '/partials/product/product-wide.html'
       });
  }
]);



Product.controller('ProductCtrl',[
  '$scope',
  '$route',
  '$rootScope',
  '$location',
  '$routeParams',
  'config',
  'category',
  'user',
  'api',
  'product',
  'cart',

  function ($scope,$route,$rootScope, $location, $routeParams, config, category, user, api, product, cart) {
    $scope.product=product;

    var cb_error=api.error($scope);

    $scope.config=config;
    $scope.cart=cart;


    $scope.showActionOnSwipe=function(id){
      // $(id).css({opacity:1,'z-index':1000});
      $(id).fadeIn();

    }

    $scope.save=function(product){
      product.save(function(s){

          //
          // this product as changed
          $rootScope.$broadcast("update.product",s);

          api.info($scope,"Votre produit a été enregistrée!",2000, function(){
            $location.path("/products/"+product.sku)
          });
      },cb_error);
    };
    
    if($route.current&&$route.current.$$route.clear){
      $scope.product={};
    }
    
    if($route.current&&$route.current.$$route.edit){
      $scope.product_edit=true;
    }

    
    $scope.love=function(product){
      if(!user.isAuthenticated()){
          api.info($scope,"Vous devez vous connecter pour utiliser cette fonctionalité");
          return;
      }
      user.love(product,function(u){
          //
          // this product as changed
          $rootScope.$broadcast("update.product",product);

          api.info($scope,"Le produit a été placé dans vos préférences!");
      })
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

    $scope.remove=function(product,password){
      product.remove(password,function(){
          $location.path("/products")
          $scope.product={};
      },cb_error);
      
    };

    


    $scope.uploadImage=function(product, imgKey){
      api.uploadfile($scope, {},function(err,fpfile){
        console.log(fpfile)
        if(err){
          api.info($scope,err.toString());
          return false;
        }
        if(!product.photo)product.photo={}
        product.photo.url=fpfile.url;
        
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
    
    
    

    /***
     * DISQUS
     */
    if($routeParams.sku){
      var doc = document.documentElement, body = document.body;
      var left = (doc && doc.scrollLeft || body && body.scrollLeft || 0);
      var top = (doc && doc.scrollTop  || body && body.scrollTop  || 0);
      $scope.scrollTop=top;
      $scope.scrollLeft=left;
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
  '$rootScope',
  '$resource',
  'api',

  function (config, $rootScope,$resource,api) {
    var _products;

    //
    // update the products that bellongs to this shop    
    $rootScope.$on("update.shop",function(e,shop){      
      var p=_products.findAll();
      for (var i in p)if(p[i].vendor.urlpath===shop.urlpath){
        p[i].vendor=shop;
        _products.share(shop)
      }      
    });



    var defaultProduct = {
      image:'',
      categories:[],
      details:{},
      attributes:{
        available:true
      },
      pricing:{},
      photo:{}
    };
    
    //
    // default behavior on error
    var onerr=function(data,config){
      //FIXME on error reset product
      //_product.copy(defaultProduct);
    };
    
    var Product = function(data) {
      //
      // this is the restfull backend for angular 
      this.backend={};
      this.backend.products=$resource(config.API_SERVER+'/v1/products/:sku',
            {sku:'@sku'}, {
            get:{method:'GET',isArray:false},
            update: {method:'POST'},
            delete: {method:'PUT'},
      });

      this.backend.category=$resource(config.API_SERVER+'/v1/products/category/:category',
            {category:'@id'}, {
            update: {method:'POST'},
            delete: {method:'PUT'},
      });

      this.backend.shop=$resource(config.API_SERVER+'/v1/shops/:shopname/products',
            {shopname:'@shopname'}, {
            update: {method:'POST'},
            delete: {method:'PUT'},
      });

      angular.extend(this, defaultProduct, data);
    }


    Product.prototype.getPrice=function(){
      if(this.attributes.discount && this.pricing.discount)
        return this.pricing.discount;
      return this.pricing.price;
    };    

    Product.prototype.isDiscount=function(){
      return(this.attributes.discount && this.pricing.discount)
    };    

    Product.prototype.isAvailableForOrder = function() {
      return (this.attributes.available && this.vendor &&
              this.vendor.status===true &&
              this.vendor.available.active!=true)
    }


    //
    // REST api wrapper
    //
    
    Product.prototype.home = function(shop,filter,cb,err) {
      if(!err) err=onerr;
      var products, 
          s, 
          product=this, 
          params=(shop)?{shopname:shop}:{}, 
          backend=(shop)?this.backend.shop:this.backend.products;

      angular.extend(params,filter)
      s=backend.get(params, function() {
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
      s=this.backend.category.query(filter, function() {
        products=product.map(s);
        if(cb)cb(products);
      },err);
      return products;
    };

    Product.prototype.findByCategory = function(cat, filter,cb,err) {
      if(!err) err=onerr;
      var products, s,product=this, params={};
      angular.extend(params,{category:cat},filter)

      s=this.backend.category.query(params, function() {
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
      
      var product=this, s=this.backend.products.get({sku:sku},function() {
        if(cb)cb(product.share(s,true));
      },err);
      return this;
    };


    Product.prototype.save = function( cb, err){
      if(!err) err=onerr;
      var product=this, s=this.backend.products.save({sku:this.sku},this, function() {
        if(cb)cb(product.share(s,true));
      },err);
      return this;
    };

    Product.prototype.create=function(shop, p,cb,err){
      if(!err) err=function(){};
      var product=this, s = this.backend.shop.save({shopname:shop},p, function() {
        product.share(s,true);
        if(cb)cb(product);
      },err);
      return this;
    };    
    
    Product.prototype.remove=function(password,cb,err){
      if(!err) err=function(){};
      var product=this, s = this.backend.products.delete({sku:this.sku},{password:password},function() {
        if(cb)cb(product);
      },err);
      return this;
    };    
   
    _products=api.wrapDomain(Product, 'sku', 'products', defaultProduct, onerr);  
    return _products;
  }
]);

