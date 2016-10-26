;(function(angular) {'use strict';

//
// Define the Product module (app.product)  for controllers, services and models
// the app.product module depend on app.config and take resources in product/*.html 
angular.module('app.product', ['app.config', 'app.api','app.ui','app.product.ui'])
  .config(productConfig)
  .controller('ProductCtrl',productCtrl)
  .factory('product',productFactory);


//
// define all routes for user api
productConfig.$inject=['$routeProvider','$locationProvider','$httpProvider'];
function productConfig($routeProvider, $locationProvider, $httpProvider){

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

//
// implement controller
productCtrl.$inject=[
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
  'documents',
  'feedback',
];

function productCtrl ($scope,$rootScope, $location, $routeParams, config, category, user, api, product, cart, shop,$doc,feedback) {
  $scope.product={};
  $scope.config=config;
  $scope.cart=cart;

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
        api.info($scope,"Votre produit a été enregistré!",2000, function(){
          window.history.back();
        });
    });
  };
  
  
  
  $scope.love=function(product){
    if(!user.isAuthenticated()){
        return api.info($scope,"Vous devez vous connecter pour utiliser cette fonctionalité");
    }
    $rootScope.WaitText="Waiting ...";
    user.love(product,function(u){
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

  

  if($routeParams.sku){
    var doc = document.documentElement, body = document.body;
    var left = (doc && doc.scrollLeft || body && body.scrollLeft || 0);
    var top = (doc && doc.scrollTop  || body && body.scrollTop  || 0);
    $scope.scrollTop=top;
    $scope.scrollLeft=left;
    product.get($routeParams.sku,function(product){
      $rootScope.title='products '+product.sku+' - '+product.title;
      $rootScope.$broadcast("feedback.update",product.vendor,product);

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
        this.callbacks.onNewComment = [function(comment) { 
          feedback.send({
              text:comment.text,
              mood:feedback.COMMENT,
              email:user.email.address,
              shopname:product.vendor.urlpath,
              product:product.title+' ('+product.sku+')'
          });
        }];
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




/**
 * app.product provides a model for interacting with Product.
 * This service serves as a convenient wrapper for other related services.
 */
productFactory.$inject=['config','$rootScope','$resource','$q','api'];
function productFactory (config, $rootScope,$resource,$q,api) {
  var _products;

  //
  // update the products that bellongs to this shop    
  $rootScope.$on("shop.update",function(e,shop){      
    var p=_products.findAll();
    for (var i in p)if(p[i].vendor.urlpath===shop.urlpath){
      p[i].vendor=shop;
    }      
  });

  //
  // wrap plain json object 
  $rootScope.$on("product.wrap",function(e,products){
    //
    // array
    if(products.length){
      return _products.wrapArray(products).forEach(function (p,i) {
        products[i]=p;
      });
    }
    //
    // singleton
    angular.extend(products,_products.wrap(products));
  });      



  var defaultProduct = {
    image:'',
    categories:[],
    details:{},
    attributes:{
      available:false
    },
    pricing:{},
    photo:{}
  };
  
    //
    // this is the restfull backend for angular 
  var backend={
    products:$resource(config.API_SERVER+'/v1/products/:sku/:category',
        {sku:'@sku',category:'@id'}, {
        get:{method:'GET',isArray:false},
        query:{method:'GET',isArray:true},
        update: {method:'POST'},
        delete: {method:'PUT'},
    }),
    shop:$resource(config.API_SERVER+'/v1/shops/:shopname/products',
        {shopname:'@shopname'}, {
        update: {method:'POST'},
        delete: {method:'PUT'},
    })
  };

  //
  // default behavior on error
  var onerr=function(data,config){
    //FIXME on error reset product
    //_product.copy(defaultProduct);
  };
  
  var Product = function(data) {
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
        rest=(shop)?backend.shop:backend.products;

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
    var rest=(filter.shopname)?backend.shop:backend.products;

    s=backend.products.query(filter, function() {
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
    var params=angular.extend({},{sku:'love'},body||{});
    var self=this, s=backend.products.query(params,function() {
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

    s=backend.products.query(params, function() {
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
    
    var product=this, s=backend.products.get({sku:sku},function() {
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


    var product=this, s=backend.products.save({sku:this.sku},this, function() {
      $rootScope.$broadcast("product.update",s);
      if(cb)cb(product);
    },err);
    return this;
  };

  Product.prototype.save = function( cb, err){
    if(!err) err=onerr;
    var product=this, s=backend.products.save({sku:this.sku},this, function() {
      $rootScope.$broadcast("product.update",s);
      if(cb)cb(product);
    },err);
    return this;
  };

  Product.prototype.create=function(shop, p,cb,err){
    if(!err) err=function(){};
    var product=this, s = backend.shop.save({shopname:shop},p, function() {
      product.wrap(s);
      if(cb)cb(product);
    },err);
    return this;
  };    
  
  Product.prototype.remove=function(password,cb,err){
    if(!err) err=function(){};
    var product=this, s = backend.products.delete({sku:this.sku},{password:password},function() {
      if(cb)cb(product);
    },err);
    return this;
  };    
 
  _products=api.wrapDomain(Product, 'sku', defaultProduct);  
  return _products;
}


})(window.angular);
