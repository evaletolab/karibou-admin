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
    

    // console.log(cart.total())
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
  '$window',
  'api',

  function (config, $timeout,$rootScope,$window, api) {


    var defaultCart={
        namespace:"kariboo_cart",
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
          { attr: "part" , label: true },
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
    };


    var localStorage=$window['localStorage'];

    
    //
    // default behavior on error
    var onerr=function(data,config){
    };
    
    var Cart = function(data) {
      this.items = [];
    }

    Cart.prototype.remove=function(product){
      for(var i=0;i<this.items.length;i++){
        if(this.items[i].sku===product.sku){
          this.items[i].quantity--;
          if(this.items[i].quantity===0){
            this.items=this.items.splice(i,1)
          }
          return this.items;
        }
      }

    }


    Cart.prototype.add=function(product){
      // console.log("add", product)
      api.info($rootScope,product.pricing.part+", "+product.title+" a été ajouté dans le panier",4000);

      for(var i=0;i<this.items.length;i++){
        if(this.items[i].sku===product.sku){
          this.items[i].quantity++;
          return this.items;
        }
      }


      this.items.push({
        name:product.title,
        sku:product.sku,
        thumb:product.photo.url,
        price:product.getPrice(),
        discount:product.isDiscount(),
        part:product.pricing.part,
        quantity:1
      });
      return this.save();
    }

    Cart.prototype.quantity=function(){
      var quantity = 0;
      this.items.forEach(function (item) {
        quantity += item.quantity;
      });
      return quantity;
    }

    Cart.prototype.total=function(){
      var total = 0;
      this.items.forEach(function (item) {
        total += item.price;
      });
      return total;
    }

    Cart.prototype.grandTotal=function(){
      this.total() + this.tax() + this.shipping();
    }

    Cart.prototype.shipping=function(){
      return defaultCart.shippingFlatRate;
    }

    Cart.prototype.tax=function(){
      return defaultCart.tax;
    }

    Cart.prototype.checkout=function(){
      alert("Oooops ça marche pas encore...")
    }



    Cart.prototype.empty=function(){
      this.items=[];      
      this.save()
    }


      // storage
    Cart.prototype.save=function () {
      if(!this.items||!localStorage) return;
      // save all the items
      // sessionStorage[defaultCart.namespace]=angular.toJson(items)
      localStorage.setItem(defaultCart.namespace, angular.toJson(this.items));
      return this;
    }

    Cart.prototype.load= function () {
      if(!localStorage)return;
      try {
        // this.items=angular.fromJson(sessionStorage[defaultCart.namespace])        
        this.items = angular.fromJson(localStorage.getItem(defaultCart.namespace ));
      } catch (e){
        api.error( "Votre ancien caddie n'a pas pu être retrouvé: " + e );
      }

      if (!this.items) {
        this.items=[]
      }
      return this;
    }

    var _cart=new Cart().load();
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

