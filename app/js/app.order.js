'use strict';

//
// Define the Order module (app.shop)  for controllers, services and models
// the app.shop module depend on app.config and take resources in shop/*.html 
var Order=angular.module('app.order', ['app.config', 'app.api']);

//
// define all routes for user api
Order.config([
  '$routeProvider',
  '$locationProvider',
  '$httpProvider',

  function ($routeProvider, $locationProvider, $httpProvider) {

    // List of routes of the application
    $routeProvider
      .when('/logistic/collect', {title:'welcome to your open community market',  templateUrl : '/partials/logistic/collect.html'})
      .when('/logistic/livraison', {title:'welcome to your open community market',  templateUrl : '/partials/logistic/overview.html'})
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
  'api',
  'order',
  'cart',
  '$log',

  function (config, $scope, $rootScope, $routeParams,  api, order, cart, $log) {
    var cb_error=api.error($scope);

    $scope.config=config;
    $scope.order=order;
    $scope.cart=cart;
    

    //console.log(order)
  }  
]);

/**
 * app.order provides a model for interacting with Order.
 * This service serves as a convenient wrapper for other related services.
 */

Order.factory('cart', [
  'config',
  '$timeout',
  '$rootScope',
  'api',

  function (config, $timeout,$rootScope, api) {


    // http://wojodesign.com/simpleCart/
    // <a href="#" 
    //    onclick="simpleCart.add('quantity=1','name=Black Gold','price=58','image=images/thumbs/blackGold.jpg');return false;"> 
    //    add to cart
    // </a>
    var defaultCart=simpleCart({
        cartColumns: [
          //A custom cart column for putting the quantity and increment and decrement items in one div for easier styling.
          { view: function(item, column){
            return  "<span>"+item.get('quantity')+"</span>" + 
                "<div>" +
                  "<a href='javascript:;' class='simpleCart_increment'><img src='/img/cart/increment.png' title='+1' alt='arrow up'/></a>" +
                  "<a href='javascript:;' class='simpleCart_decrement'><img src='/img/cart/decrement.png' title='-1' alt='arrow down'/></a>" +
                "</div>";
          }, attr: 'custom' },
          //Name of the item
          { attr: "name" , label: false },
          //Subtotal of that row (quantity of that item * the price)
          { view: 'currency', attr: "total" , label: false  }
        ],


        checkout: { 
            type: "PayPal" , 
            email: "evaleto@gmail.com" 
        },
        cartStyle:'div',
        shippingFlatRate: 10,
        tax:        0.015,
        currency:   "CHF"
    });

    function simpleCart_sync() {
      $timeout(function(){
        _cart.quantity  = simpleCart.quantity();
        _cart.total     = simpleCart.total();
        _cart.grandTotal= simpleCart.grandTotal();
        _cart.shipping  = simpleCart.shipping();      

      },0)
    }

    //
    // get the cart ready to use
    simpleCart.bind( 'load' , function(){
      if (_cart.items===null){
        return _cart.items=[];
      }
      simpleCart.each(function( item , x , attr){
          _cart.items.push( item);
      });      
      simpleCart_sync()
    });

    // see if a new item has been added, or updated
    simpleCart.bind( "afterAdd" , function( item , isNew ){
      if( isNew ){
        _cart.items.push(item);
      }
      simpleCart_sync()
    });

    simpleCart.bind( 'beforeRemove' , function( item ){
      simpleCart_sync()
    });


    
    //
    // default behavior on error
    var onerr=function(data,config){
      _cart.copy(defaultCart);
    };
    
    var Cart = function(data) {
      this.quantity=0;
      this.items = null;
      this.total=0;
      this.grandTotal=0;
      this.shipping; 
      this.isReady = false;
      this.defaultCart=defaultCart;

      angular.extend(this, data);
    }

    Cart.prototype.add=function(product){
      // console.log("add", product)
      api.info($rootScope,product.pricing.part+", "+product.title+" a été ajouté dans le panier",4000);

      return simpleCart.add({
        name:product.title+" ("+product.pricing.part+")",
        id:product.sku,
        thumb:product.photo.url,
        price:product.pricing.price,
        quantity:1
      });
    }

    Cart.prototype.love=function(value){
      console.log("love", value)
      // return simpleCart.add(value);
    }

    Cart.prototype.checkout=function(){
      return simpleCart.checkout();
    }

    Cart.prototype.empty=function(){
      simpleCart.empty();
      this.items=[];
      return simpleCart_sync()
    }

    var _cart=new Cart();
    return _cart;
  }
]);
    

/**
 * app.order provides a model for interacting with Order.
 * This service serves as a convenient wrapper for other related services.
 */

Order.factory('order', [
  'config',
  '$resource',
  'api',

  function (config, $resource, api) {

    var defaultOrder={}


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

