'use strict';

//
// Define the Order module (app.shop)  for controllers, services and models
// the app.shop module depend on app.config and take resources in shop/*.html 
var Order=angular.module('app.order', ['app.order.ui','app.config', 'app.api']);

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
  '$location',
  '$rootScope',
  'api',
  'order',
  'cart',
  'user',
  '$log',

  function (config, $scope, $location, $rootScope,  api, order, cart, user, $log) {
    var cb_error=api.error($scope);

    $scope.config=config;
    $scope.order=order;
    $scope.shipping=order.nextsShippingDate();
    $scope.cart=cart;
    $scope.errors=false;
    

    //
    // init order fields
    user.$promise.then(function(){
      var p=user.hasPrimaryAddress();
      order.address=(p!=-1)?p:0;      
    })

    $scope.updateGateway=function(){
      cart.setTax(config.shop.order.gateway[order.payment].fees)   
    }


    $scope.terminateOrder=function(){

      //
      // prepare shipping
      var shipping=user.addresses[order.address];
      shipping.when=$scope.shipping[$scope.order.shipping].when;

      //
      // prepare items
      var items=$scope.cart.items;
      //
      //
      var payment=config.shop.order.gateway[order.payment].label;
      order.create(shipping,items,payment,function(order){
        if(order.errors){
          $rootScope.errors=order.errors
          return;
        }

        var labels=order.getShippingLabels();

        var when=labels.date+" entre "+labels.time;
        api.info($scope, "Votre  commande est enregistré, vous serez livré le "+when,6000)
      },cb_error)
    }


    $scope.getItem=function(sku){
      return cart.findBySku(sku)
    }

    //
    // get order by user
    $scope.orders=[];
    $scope.findOrderByUser=function(){
      user.$promise.then(function(){
        order.findOrdersByUser(user).$promise.then(function(orders){
          $scope.orders=orders;
        });

      })
    }

  }  
]);

Order.filter('dateLabel', function () {
   return function(shipping, prefix) {
        if (!shipping) return "";
        if (!prefix) prefix="";

        var date=(shipping.when)?shipping.when:shipping,
            time=(shipping.time)?' entre '+shipping.time:''
        return  prefix+moment(date).format('dddd DD MMM YYYY', 'fr')+time;
   };
});


Order.filter('orderTotal', function () {
   return function(order) {
        if (!order||!order.items.length) return "0.0 CHF";
        var price=0.0;
        for (var i in order.items){
          price+=parseFloat(order.items[i].finalprice)*order.items[i].quantity
        }
        return price.toFixed(2)+" CHF"
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
          this.items.splice(i,1)
          return this.items;
        }
      }
    }

    Cart.prototype.remove=function(product){
      for(var i=0;i<this.items.length;i++){
        if(this.items[i].sku===product.sku){
          this.items[i].quantity--;
          if(this.items[i].quantity===0){
            this.items.splice(i,1)
          }
          return this.items;
        }
      }

    }
    Cart.prototype.addList=function(products){
      var total=0;
      for(var i in products){
        // if(products[i].isAvailableForOrder()){
          this.add(products[i], true);
          total++;
        // }
      }
      if(total)
        api.info($rootScope,total+" produits de la liste ont été ajoutés dans le panier.",4000);      
      else
        api.info($rootScope," Seul les produits disponibles peuvent être ajoutés dans le panier.",4000);      
    }

    Cart.prototype.add=function(product, silent){
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
        title:product.title,
        sku:product.sku,
        thumb:product.photo.url,
        price:product.getPrice(),
        finalprice:product.getPrice(),
        categories:product.categories._id,
        vendor:product.vendor._id,
        discount:product.isDiscount(),
        part:product.pricing.part,
        quantity:1
      });
      return this.save();
    }
    Cart.prototype.findBySku=function(sku){
      var product = false;
      this.items.forEach(function (item) {
        if(item.sku==sku){
          product=item
        }
      });
      return product;      
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
    // user is a promise 
    // WARNING user state (anonymous to logged) is not in the promise
    user.$promise.then(function(){
    })
      

    //
    // default behavior on error
    var onerr=function(data,config){
      _order.copy(defaultOrder);
    };
    
    var Order = function(data) {
      angular.extend(this, defaultOrder, data);

      //
      // define DAO
      this.backend={}
      this.backend.$order=$resource(config.API_SERVER+'/v1/orders/:oid',
              {oid:'@oid'}, {
              update: {method:'POST'},
              delete: {method:'PUT'},
      });

      this.backend.$user=$resource(config.API_SERVER+'/v1/users/:id/:action/:aid',
              {id:'@id',action:'@action',aid:'@aid'}, {
              update: {method:'POST'},
              delete: {method:'PUT'},
      });

      //
      // wrap promise to this object
      this.$promise=$q.when(this)

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

    Order.prototype.getShippingLabels=function(){
        var time=config.shop.order.shippingtimes[new Date(this.shipping.when).getHours()]
        var date=moment(date).format('dddd DD MMM YYYY', 'fr');
        
        return {date:date,time:time}
    }

    Order.prototype.getProgress=function(){
        //
        // end == 100%
        var end=this.items.length+2;
        var progress=0;
        //
        // failure, create, partial, fulfilled
        if(this.fulfillments.status==='failure'||this.fulfillments.status==='fulfilled'){
          return 100.00;          
        }
        progress++

        //
        // pending, paid, voided, refunded
        if(this.payment.status==='pending'){
          return (progress/end*100.00);          
        }

        progress++

        for (var i in this.items){          
          if(this.items[i].fulfillments.status==='fulfilled'){
            progress++
          }
        }     
        return (progress/end*100.00); 
    }

    Order.prototype.getTitle=function(){

      //
      // failure, 
      if(this.fulfillments.status==='failure'){
        return "Commande annulée";          
      }

      //
      // pending, paid, voided, refunded
      if(this.payment.status==='pending'){
        return "Commande en attente de paiement";          
      }

      //
      // partial
      if(this.fulfillments.status==='partial'){
        return "La commande est en attente de traitement";          
      }      
      var labels=this.getShippingLabels();

      return "Livré le "+labels.date;

    }


    Order.prototype.findAll=function(user){
      var self=this;
      return this.chain(this.backend.$order.query(function() {
      }).$promise);
    }


    Order.prototype.create=function(shipping,items,payment, cb,err){
      if(!err) err=function(){};
      var self=this, s = this.backend.$order.save({shipping:shipping,items:items,payment:payment}, function() {
        self.wrap(s);
        if(cb)cb(self)
      },err);
      return self;
    };    
    

    Order.prototype.findOrdersByUser=function(user){ 
      var self=this; var lst=[]
      return this.chainAll(this.backend.$user.query({id:user.id,action:'orders'}).$promise);
    }    


    var _order=api.wrapDomain(Order,'oid', defaultOrder);
    return _order;
  }
]);

