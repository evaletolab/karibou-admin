;(function(angular) {'use strict';

//
// Define the Product module (app.product)  for controllers, services and models
// the app.product module depend on app.config and take resources in product/*.html 
var Product=angular.module('app.product', ['app.config', 'app.api','app.ui','app.product.ui']);


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
      .when('/shop/:shop/products/create', {
          title:'Créer un nouveau produit ',clear:true, modal:true, view:'modal',controller:'ProductCtrl', templateUrl : '/partials/product/create.html'
       })
      .when('/products/category/:category', {
          title:'Les produits ',  templateUrl : '/partials/product/products.html'
      })
      .when('/shop/:shop/products/:sku/edit', {
          title:'Votre produit ', modal:true, edit:true, view:'modal',controller:'ProductCtrl', templateUrl : '/partials/product/create.html'
       })
      .when('/products/:sku/edit', {
          title:'Votre produit ', modal:true, edit:true, view:'modal',controller:'ProductCtrl', templateUrl : '/partials/product/create.html'
       })
      .when('/products/:sku/:title?', {
          modal:true,view:'modal',controller:'ProductCtrl', templateUrl : '/partials/product/product-wide.html'
       })
      .when('/shop/:shop/products/:sku/:title?', {
          modal:true,view:'modal',controller:'ProductCtrl', templateUrl : '/partials/product/product-wide.html'
       });
  }
]);



Product.controller('ProductCtrl',[
  '$scope',
  '$rootScope',
  '$location',
  '$routeParams',
  'config',
  'category',
  'user',
  'api',
  'product',
  'cart',
  'shop',

  function ($scope,$rootScope, $location, $routeParams, config, category, user, api, product, cart, shop) {
    $scope.product={};
    $scope.config=config;
    $scope.cart=cart;

    // console.log('DEBUG-CTRL------------->',product)
    //
    // 
    $scope.rootProductPath=($routeParams.shop)?'/shop/'+$routeParams.shop:'';



    $scope.showPreviousProduct=function(sku){
      var lst=$scope.product.findAll().filter(function(p){
        if(p.categories._id==$scope.product.categories._id)return p;
      });
      for(var i=lst.length-1;i>=0;i--){
        if(lst[i]&&lst[i].sku===sku){
          var newprod=(i===0)?lst[lst.length-1]:lst[i-1];
          var path=$location.path();
          return $location.path(path.replace(/products\/.*/,'products/'+newprod.sku));
        }
      }
    };

    $scope.showNextProduct=function(sku){
      var lst=$scope.product.findAll().filter(function(p){
        if(p.categories._id==$scope.product.categories._id)return p;
      });
      for(var i=0;i<lst.length;i++){
        if(lst[i]&&lst[i].sku===sku){
          var newprod=(i===lst.length-1)?lst[0]:lst[i+1];
          var path=$location.path();
          return $location.path(path.replace(/products\/.*/,'products/'+newprod.sku));
        }
      }
    };




    $scope.save=function(product){
      $rootScope.WaitText="Waiting ...";
      product.save(function(s){

          //
          // this product as changed
          $rootScope.$broadcast("update.product",s);

          api.info($scope,"Votre produit a été enregistré!",2000, function(){
            $location.path("/products/"+product.sku);
          });
      });
    };
    
    
    
    $scope.love=function(product){
      if(!user.isAuthenticated()){
          return api.info($scope,"Vous devez vous connecter pour utiliser cette fonctionalité");
      }
      $rootScope.WaitText="Waiting ...";
      user.love(product,function(u){
          //
          // this product as changed
          $rootScope.$broadcast("update.product",product);

          api.info($scope,"Le produit a été placé dans vos préférences!");
      });
    };

    $scope.create=function(shop,p){
      if (!shop){
        return api.info($scope,"Vous devez préciser la boutique");
      }
      $rootScope.WaitText="Waiting ...";
      product.create(shop,p,function(product){
          $location.path("/products/"+product.sku);
          $scope.product=product;
      });
      
    };

    $scope.remove=function(product,password){
      product.remove(password,function(){
          $location.path("/products");
          $scope.product={};
      });
      
    };

    


    $scope.uploadImageError=function(error){
        //http://ucarecdn.com/c1fab648-f6b7-4623-8070-798165df5ca6/-/resize/300x/
        if(error){
          return api.info($scope,error);
        }

    };
    
    
    
    // FIXME make shops available in root ctrl
    // load shops for edit
    if(!$scope.shopsSelect){
      $scope.shopsSelect=shop.query({});        
    }

    if($routeParams.sku){
      var doc = document.documentElement, body = document.body;
      var left = (doc && doc.scrollLeft || body && body.scrollLeft || 0);
      var top = (doc && doc.scrollTop  || body && body.scrollTop  || 0);
      $scope.scrollTop=top;
      $scope.scrollLeft=left;
      product.get($routeParams.sku,function(product){
        $rootScope.title='products '+product.sku+' - '+product.title;
        $scope.product=product;
        if(product.attributes.comment){
          loadDisqus($location.path(), product.title);
        }

      });


    }          
    
    /***
     * DISQUS
     */

    function loadDisqus(currentPageId, title) {
      // http://docs.disqus.com/help/2/
      // https://disqus.com/api/applications/
      // window.disqus_category_id ='';
      window.disqus_shortname = 'karibou';
      window.disqus_identifier = currentPageId;
      if(title) {window.disqus_title = title;}
      window.disqus_config = function () {
          this.language = "fr_CH";
      };          
      
      if (['localhost','lo.cal'].indexOf($location.host())>-1) {
        window.disqus_developer = 1;
      }

      //
      // SSO auth user 
      if(user.context&&user.context.disqus){
        window.disqus_config = function () {
            // The generated payload which authenticates users with Disqus
            this.page.remote_auth_s3 = user.context.disqus.auth;
            this.page.api_key = user.context.disqus.pubKey;
            this.language = "fr_CH";
        };          

      }
      var disqus=document.getElementById('disqus_thread');
      angular.element(disqus).html('');
      if(window.DISQUS && disqus){
        // try{
          window.DISQUS.reset({reload: true, config:window.disqus_config});
        // }catch(e){}
        return;
      }
      
      // https://disqus.com/api/applications/
      // http://docs.disqus.com/developers/universal/
      (function() {
        var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;
        dsq.src = '//karibou.disqus.com/embed.js';
        (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
      })();

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
  '$q',
  'api',

  function (config, $rootScope,$resource,$q,api) {
    var _products;

    //
    // update the products that bellongs to this shop    
    $rootScope.$on("update.shop",function(e,shop){      
      var p=_products.findAll();
      for (var i in p)if(p[i].vendor.urlpath===shop.urlpath){
        p[i].vendor=shop;
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
      this.backend.products=$resource(config.API_SERVER+'/v1/products/:sku/:category',
            {sku:'@sku',category:'@id'}, {
            get:{method:'GET',isArray:false},
            query:{method:'GET',isArray:true},
            update: {method:'POST'},
            delete: {method:'PUT'},
      });


      this.backend.shop=$resource(config.API_SERVER+'/v1/shops/:shopname/products',
            {shopname:'@shopname'}, {
            update: {method:'POST'},
            delete: {method:'PUT'},
      });

      angular.extend(this, defaultProduct, data);

      //
      // wrap promise to this object
      this.$promise=$q.when(this);

    };


    Product.prototype.hasFixedPortion=function(){
        var weight=this.pricing.part||'';
        var m=weight.match(/~([0-9.]+) ?(.+)/);
        return(!m||m.length<2);
    };

    Product.prototype.getPrice=function(){
      if(this.attributes.discount && this.pricing.discount)
        return this.pricing.discount;
      return this.pricing.price;
    };    

    Product.prototype.isDiscount=function(){
      return(this.attributes.discount && this.pricing.discount);
    };    

    Product.prototype.isAvailableForOrder = function() {
      var ok=(this.attributes.available && this.vendor &&
              this.vendor.status===true);
      // if(this.vendor&&this.vendor.active){
        
      // }
      return ok;
    };


    //
    // REST api wrapper
    //

    function products_wrap_dates (product) {
      product.updated=new Date(product.updated);
      product.created=new Date(product.created);
    }
    
    Product.prototype.home = function(shop,filter,cb,err) {
      if(!err) err=onerr;
      var products, 
          s, 
          product=this, 
          params=(shop)?{shopname:shop}:{}, 
          rest=(shop)?this.backend.shop:this.backend.products;

      angular.extend(params,filter);
      s=rest.get(params, function() {
        products={};
        for (var group in s){
          products[group]=[];
          if (Array.isArray(s[group]) && typeof s[group][0]==="object"){
            products[group]=product.wrapArray(s[group]);
            //
            // wrap dates for sorting !!!
            products[group].forEach(products_wrap_dates);
          }
        }
        if(cb)cb(products);
      },err);
      return products;
    };

    
    Product.prototype.query = function(filter,cb,err) {
      if(!err) {err=onerr;}
      var products, s,product=this;
      var rest=(filter.shopname)?this.backend.shop:this.backend.products;

      s=rest.query(filter, function() {
        products=product.wrapArray(s);

        //
        // wrap dates for sorting !!!
        products.forEach(products_wrap_dates);

        if(cb)cb(products);
      },err);
      return products;
    };


    Product.prototype.findLove = function(body,cb,err) {
      if(!err) {err=onerr;}
      var products;
      var params=angular.extend({},{sku:'love'},body||{})
      var self=this, s=this.backend.products.query(params,function() {
        products=self.wrapArray(s);
        //
        // wrap dates for sorting !!!
        products.forEach(products_wrap_dates);

        if(cb)cb(products);
        return self;
      },err);
      return self;
    };

    Product.prototype.findByCategory = function(cat, filter,cb,err) {
      if(!err) err=onerr;
      var products, s,product=this, params={sku:'category'};
      angular.extend(params,{category:cat},filter);

      s=this.backend.products.query(params, function() {
        products=product.wrapArray(s);
        //
        // wrap dates for sorting !!!
        products.forEach(products_wrap_dates);

        if(cb)cb(products);
      },err);
      return products;
    };


    Product.prototype.get = function(sku,cb,err) {
      if(!err) err=onerr;
      
      var loaded=Product.find(sku);if (loaded){
        if(cb)cb(loaded);
        return loaded;
      }
      
      var product=this, s=this.backend.products.get({sku:sku},function() {
        if(cb)cb(product.wrap(s));
      },err);
      return this;
    };


    Product.prototype.updateAndSave = function( cb, err){
      if(!err) err=onerr;
      // stock has been modified
      if(this.pricing._stock){
        this.pricing.stock=parseInt(this.pricing._stock);
        // this.pricing._stock=undefined
      }

      // price has been modified
      if(this.pricing._price){
        this.pricing.price=(this.pricing._price);
      }

      // weight has been modified
      if(this._weight){
        this.weight=(this._weight);
      }


      var product=this, s=this.backend.products.save({sku:this.sku},this, function() {
        if(cb)cb(product);
      },err);
      return this;
    };

    Product.prototype.save = function( cb, err){
      if(!err) err=onerr;
      var product=this, s=this.backend.products.save({sku:this.sku},this, function() {
        if(cb)cb(product);
      },err);
      return this;
    };

    Product.prototype.create=function(shop, p,cb,err){
      if(!err) err=function(){};
      var product=this, s = this.backend.shop.save({shopname:shop},p, function() {
        product.wrap(s);
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
   
    _products=api.wrapDomain(Product, 'sku', defaultProduct);  
    return _products;
  }
]);


})(window.angular);
