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
      .when('/order', {title:'Valider votre commande',  templateUrl : '/partials/order/order.html'})
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
    $scope.shipping=order.nextsShippingDate();
    $scope.cart=cart;
    


    $scope.updateGateway=function(){
      cart.setTax(config.shop.order.gateway[order.payment].fees)   
    }


    $scope.terminateOrder=function(){
      console.log("order")
      console.log("payment",config.shop.order.gateway[order.payment])
      console.log("shipping",$scope.shipping[$scope.order.shipping])
      console.log("items",$scope.cart.items)
    }

  }  
]);

Order.filter('shippingLabel', function () {
   return function(shipping) {
        if (!shipping) return "";
        return  "Le "+moment(shipping.when).format('dddd DD MMM YYYY', 'fr')+" entre "+shipping.time;
   };
});

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
        tax:        0.00,
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

    Cart.prototype.clear=function(product){
      for(var i=0;i<this.items.length;i++){
        if(this.items[i].sku===product.sku){
          this.items=this.items.splice(i,1)
          return this.items;
        }
      }
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
    Cart.prototype.addList=function(products){
      var total=0;
      for(var i in products){
        if(products[i].isAvailableForOrder()){
          this.add(products[i], true);
          total++;
        }
      }
      if(total)
        api.info($rootScope,total+" produits de la liste ont été ajoutés dans le panier.",4000);      
      else
        api.info($rootScope," Seul les produits disponibles peuvent être ajoutés dans le panier.",4000);      
    }

    Cart.prototype.add=function(product, silent){
      // console.log("add", product)
      if(!silent)api.info($rootScope,product.pricing.part+", "+product.title+" a été ajouté dans le panier",4000);

      for(var i=0;i<this.items.length;i++){
        if(this.items[i].sku===product.sku){

          //
          // check availability
          if(product.pricing&&product.pricing.stock<=this.items[i].quantity){
            return api.info($rootScope,"La commande maximum pour ce produit à été atteintes.",4000);                        
          }

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
        total += (item.price*item.quantity);
      });
      return total;
    }

    Cart.prototype.grandTotal=function(){
      var total=this.total();
      return (total + this.tax()*total + this.shipping());
    }

    Cart.prototype.shipping=function(){
      return defaultCart.shippingFlatRate;
    }

    Cart.prototype.tax=function(){
      return defaultCart.tax;
    }

    Cart.prototype.setTax=function(tax){
      defaultCart.tax=tax;
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
  '$q',
  'user',
  'api',

  function (config, $resource, $q, user, api) {

    var defaultOrder={
      shipping:0,
      address:undefined,
    }

    //
    // shop config is a promise
    config.shop.then(function(){

    })

    //
    // user is a promise
    user.then(function(){
      var p=user.hasPrimaryAddress();
      if(p==-1) p=0;
      _order.address=defaultOrder.address=p;      
    })
      

    //
    // default behavior on error
    var onerr=function(data,config){
      _order.copy(defaultOrder);
    };
    
    var Order = function(data) {
      angular.extend(this, defaultOrder, data);
    }

    Order.prototype.nextsShippingDate=function(){
      var date=[], next, order=this;
      var deferred=$q.defer();
      config.shop.then(function(){
        while(date.length<4){
          next=order.findNextShippingDay(next);
//          date.push(next)
          if(!config.shop.order.shippingtimes){
            throw new Error("Votre application doit être reloadé.")
          }
          for(var k in config.shop.order.shippingtimes){
            next.setHours(k)
            date.push({id:date.length||0,when:next,time:config.shop.order.shippingtimes[k]});
          }
        }
        return date
      })

      return date
    }

    Order.prototype.findNextShippingDay=function(date){
      // 86400000[ms] = 24 * 60² * 1000
      if(date === undefined){
        var date=new Date()
      }
      var next=new Date(date.getTime()+config.shop.order.timelimit*3600000);
      while(config.shop.order.weekdays.indexOf(next.getDay())<0){
        next=new Date(next.getTime()+86400000)
      }
      next.setMinutes(0,0,0)
      next.setHours(6)

      return next;
    }

     Order.prototype.findShippingDayFromDate=function(date, jump) {
      // 86400000[ms] = 24 * 60² * 1000
      if(date === undefined){
        var date=new Date(), jump=date.getDay()
      }
      var nextday=((jump-date.getDay())%7)
      var week=(nextday>=0)?0:7*86400000;
      var r=new Date(+date.getTime()+nextday*86400000+week)
      r.setMinutes(0,0,0)
      r.setHours(12)
      return r;

    }



    Order.prototype.create=function(cat, cb,err){
      if(!err) err=function(){};
      var order=this, s = $resource(config.API_SERVER+'/v1/order').save(cat, function() {
        order=order.share(s,true);
        if(cb)cb(order);
      },err);
      return order;
    };    
    

    var _order=api.wrapDomain(Order,'slug', 'order', defaultOrder, onerr); 
    return _order;       



  }
]);

