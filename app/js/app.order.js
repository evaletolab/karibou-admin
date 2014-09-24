'use strict';

//
// Define the Order module (app.shop)  for controllers, services and models
// the app.shop module depend on app.config and take resources in shop/*.html 
var Order=angular.module('app.order', ['app.order.ui','app.config', 'app.api','app.order.admin']);

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
      .when('/order', {title:'Valider votre commande', templateUrl : '/partials/order/order.html'})
      .when('/order/:process', {title:'Bank feedback', templateUrl : '/partials/order/order.html'})
      .when('/shop/admin/orders', {title:'List next orders ',  templateUrl : '/partials/shop/orders.html'})
      .when('/admin/orders', {title:'List next orders ',  templateUrl : '/partials/admin/orders.html'})
      .when('/admin/order', {title:'Admin of order ',  templateUrl : '/partials/admin/order.html'});
  }
]);


Order.controller('OrderCtrl',[
  'config',
  '$scope',
  '$location',
  '$rootScope',
  '$routeParams',
  '$timeout',
  'api',
  'order',
  'cart',
  'user',
  'shop',
  'product',
  'Map',
  '$log',

  function (config, $scope, $location, $rootScope,$routeParams, 
           $timeout,  api, order, cart, user, shop, product, Map, $log) {
    var cb_error=api.error($scope);

    $scope.map=new Map()
    $scope.config=config;
    $scope.order=order;
    $scope.cart=cart;
    $scope.errors=false;
    $scope.orders=[];
    $scope.products=[];
    $scope.filters={}
    $scope.shops=false;
    $scope.profileReady=(user.isReady()&&user.hasPrimaryAddress())

    // default model for modal view
    $scope.modal = {};      
    $scope.prefix="livraison du "

    //
    // state of the flow
    $scope.process=$routeParams.process;

    //
    // initial flow
    // user.anon && profile   => /order/identity
    // user.anon              => /order/identity
    // !user.ready            => /order/profile
    // user.ready && !process => /order/validation
    // user.ready &&  process => /order/process

    // user.$promise.finally(function(){
      if(!user.isAuthenticated() && $scope.process==='profile'){
        $location.path('/order/profile')
      }else if(!user.isAuthenticated()){
        $location.path('/order/identity')
      }else if(!$scope.profileReady){
        $location.path('/order/profile')
        //
        // the profile is now ok
      }else if(!$scope.process){
        $location.path('/order/validation')
      }else if($scope.process==='identity'){
        $location.path('/order/profile')
      }
    // });

    // remove displayed cart
    $('html').removeClass('display-cart')

    //
    // init order fields
    user.$promise.then(function(){
      var p=user.hasPrimaryAddress();
      $scope.cart.config.address=(p!=-1)?p:0;      
      if(!user.addresses.length)user.addresses.push({})
      if(!user.phoneNumbers.length)user.phoneNumbers.push({})
    })

    config.shop.then(function(){
      $scope.shippingDays=order.findOneWeekOfShippingDay();
      if($scope.shipping)
        return
      $scope.shipping=order.findCurrentShippingDay();
    })
 
 
 
    $scope.currentFlow=function(flow){

      return flow.indexOf($scope.process)>-1
    }

    $scope.updateFlow=function(flow){
      $location.search('process',flow)
    }

    //
    // geomap init
    $scope.updateMap=function(address, cb){
      if (address.streetAdress===undefined||address.postalCode===undefined)
       return;

      $scope.map.geocode(address.streetAdress, address.postalCode, address.country, function(geo){
        if(!geo.results.length||!geo.results[0].geometry){
          if(cb)cb("L'adresse n'a pas été trouvé, soit le serveur est en panne, soit vous devez modifier votre adresse")
         return;
        }
        //
        //update data
        address.geo={};
        address.geo.lat=geo.results[0].geometry.location.lat;
        address.geo.lng=geo.results[0].geometry.location.lng;
        if(cb)cb(null,address)
      })
    };  
    //
    // if user => save profile
    // if !user=> register+save profile 
    $scope.saveIdentity=function(u){
      $rootScope.WaitText="Waiting ..."
      user.populateAdresseName(u);

      $scope.updateMap(u.addresses[0],function(err,address){
        if(err){
          return api.info($scope,err)
        }

        if(user.isAuthenticated()){
          return user.save(u,function(){
            api.info($scope,"Votre profile est enregistré");
            $location.path("/order/validation")
          },cb_error);
        }
        // else , register a new and complete profile
        var reg={email:u.email.address,firstname:u.name.givenName,lastname:u.name.familyName,
              password:u.password.new,confirm:u.password.copy,
              addresses:u.addresses,
              phoneNumbers:u.phoneNumbers
        };
        
        user.register(reg,function(){
          api.info($scope,"Merci, votre compte à été créé! Une demande de confirmation vous a été envoyée à votre adresse email")
          $location.url('/order/validation');
        },cb_error);
      });
    }

    $scope.verify=function(user){
      $rootScope.WaitText="Waiting ..."
      user.validateEmail(function(validate){
        api.info($scope,"Merci, une confirmation a été envoyée à votre adresse email");
        if (!user.isAuthenticated())
          $location.url('/');
      },cb_error);      
    }
  

    //
    // login action
    $scope.login= function(email,password){
      $rootScope.WaitText="Waiting ..."
      user.login({ email: email, password:password, provider:'local' },function(u){
        api.info($scope,"Merci, vous êtes dès maintenant connecté");

        // 
        // if user profile is not ready?
        if(!user.isReady()||!user.hasPrimaryAddress()){
          return $location.url('/order/profile');  
        }

        //
        // else goto '/'
        $location.url('/order/validation');
      }, cb_error);
    };    

    $scope.updateGateway=function(){
      cart.setTax(config.shop.order.gateway[cart.config.payment].fees)   
    }

    $scope.terminateOrder=function(){
      $rootScope.WaitText="Waiting..."

      //
      // prepare shipping
      var shipping=user.addresses[cart.config.address];
      shipping.when=new Date($scope.shippingDays[cart.config.shipping].when);


      //
      // prepare items
      var items=$scope.cart.items;
      //
      //
      var payment=config.shop.order.gateway[cart.config.payment].label;

      // clear error 
      order.errors=undefined
      cart.clearErrors()
      order.create(shipping,items,payment,function(order){
        if(order.errors){
          cart.setError(order.errors)
          return;
        }

        //
        // reset accepted CG by user
        $scope.cg=false;

        var labels=order.getShippingLabels();

        var when=labels.date+" entre "+labels.time;
        //
        // empty the current cart to avoid multiple order
        cart.empty()
        api.info($scope, "Votre  commande est enregistré, vous serez livré le "+when,6000)
        //$('#postfinance-form').submit()
      },cb_error)
    }


    $scope.getItem=function(sku){
      return cart.findBySku(sku)
    }
  }  
]);

Order.filter('dateLabel', function () {
   return function(shipping, prefix) {
        if (!shipping) return "";
        if (!prefix) prefix="";

        var date=(shipping.when)?shipping.when:shipping,
            time=(shipping.time)?' de '+shipping.time:''
        return  prefix+moment(date).format('ddd DD MMM YYYY', 'fr')+time;
   };
});

Order.filter('dateLabelShort', function () {
   return function(shipping, prefix) {
        if (!shipping) return "";
        if (!prefix) prefix="";

        var date=(shipping.when)?shipping.when:shipping,
            time=(shipping.time)?' de '+shipping.time:''
        return  prefix+moment(date).format('ddd DD MMM', 'fr')+time;
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
      this.config={shipping:0,address:undefined}
    }

    Cart.prototype.clear=function(product){
      for(var i=0;i<this.items.length;i++){
        if(this.items[i].sku===product.sku){
          this.items.splice(i,1)
          return this.items;
        }
      }
      
      return this.save();
    }

    Cart.prototype.remove=function(product,silent){
      $rootScope.CartText="Waiting";
      $timeout(function() { $rootScope.CartText=false }, 1000);

      if(!silent){
        var title=(product.pricing&&product.pricing.part)?
                product.pricing.part+", "+product.title+" a été enlevé du panier":
                product.title+" a été enlevé du panier"
        api.info($rootScope,title,2000)
      }

      for(var i=0;i<this.items.length;i++){
        if(this.items[i].sku===product.sku){
          this.items[i].quantity--;

          //
          // update the finalprice
          this.items[i].finalprice=this.items[i].price*this.items[i].quantity

          if(this.items[i].quantity===0){
            this.items.splice(i,1)
          }
          this.save()
          return this.items;
        }
      }
      
      return this.save();
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
      if(!silent){
        $rootScope.CartText="Waiting";
        $timeout(function() { $rootScope.CartText=false }, 1000);
        api.info($rootScope,product.pricing.part+", "+product.title+" a été ajouté dans le panier",4000);
      }

      for(var i=0;i<this.items.length;i++){
        if(this.items[i].sku===product.sku){

          //
          // check availability
          if(product.pricing&&product.pricing.stock<=this.items[i].quantity){
            return api.info($rootScope,"La commande maximum pour ce produit à été atteintes.",4000);                        
          }

          this.items[i].quantity++;
          //
          // update the finalprice
          this.items[i].finalprice=this.items[i].price*this.items[i].quantity

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

    Cart.prototype.setError=function(errors){
      var sku, item;

      for(var i=0;i<errors.length;i++){
        sku=Object.keys(errors[i])[0];
        item=this.findBySku(sku)
        if (item)item.error=errors[i][sku];
      }
    }


// clear error 
    Cart.prototype.clearErrors=function(){
      for(var i=0;i<this.items.length;i++){
        if(this.items[i].error )this.items[i].error=undefined
      }
    }


    Cart.prototype.hasError=function(){
      for(var i=0;i<this.items.length;i++){
        if(this.items[i].error){
          return true
        }
      }
      return false;
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
        if(console)console.log("loading cart",this.items)
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
  'shop',
  'api',

  function (config, $resource, $q, user,shop, api) {

    var defaultOrder={
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

      // define DAO
      this.backend={}

      // default data
      this.shipping={}
      this.items={}

      // GET
      // '/v1/orders'
      // '/v1/orders/shops/:shopname'
      // '/v1/orders/users/:id'
      // '/v1/orders/:oid'

      // POST
      // '/v1/orders/items/verify'
      // '/v1/orders'
      // '/v1/orders/:oid'

      this.backend.$order=$resource(config.API_SERVER+'/v1/orders/:action/:id',
              {action:'@action',id:'@id'}, {
              update: {method:'POST'},
              delete: {method:'PUT'},
      });

      this.backend.$user=$resource(config.API_SERVER+'/v1/orders/users/:id',
              {id:'@id',action:'@action',aid:'@aid'}, {
              update: {method:'POST'},
              delete: {method:'PUT'},
      });

      //
      // wrap promise to this object
      this.$promise=$q.when(this)

    }



 

    /* return array of one week of shipping days available for customers*/
    Order.prototype.findOneWeekOfShippingDay=function(){
      var next=this.findNextShippingDay(), result=[], all=[next], nextDate

      config.shop.order.weekdays.forEach(function(day){
        // next = 2
        // all=[1,2,4]
        // result =[2,4,1]
        if(day<next.getDay()){
            nextDate=new Date((7-next.getDay()+day)*86400000+next.getTime());
            if(config.shop.order.weekdays.indexOf(nextDate.getDay())!=-1)
              all.push(nextDate)
        }else if(day>next.getDay()){
            nextDate=new Date((day-next.getDay())*86400000+next.getTime())
            if(config.shop.order.weekdays.indexOf(nextDate.getDay())!=-1)
              all.push(nextDate)
        }    
      })

      // sorting dates
      all=all.sort(function(a,b){
        // Turn your strings into dates, and then subtract them
        // to get a value that is either negative, positive, or zero.
        return a.getTime() - b.getTime();
      });


      //
      // construct object with delivery options
      var elem=0;
      all.forEach(function(next,idx){
        for(var k in config.shop.order.shippingtimes){

          next.setHours(k,0,0,0)
          result.push({id:elem++,when:new Date(next),time:config.shop.order.shippingtimes[k]});
        }
      })

      return result

    }

    /* return the next shipping day available for customers*/
    Order.prototype.findNextShippingDay=function(){
      var now=new Date()
      // computing order start always at 18:00PM
      //now.setHours(18,0,0,0);
      now=now.getTime()
      var next=new Date(now+config.shop.order.timelimit*3600000);

      //
      // next is available until time  (timeLimitH)
      next.setHours(config.shop.order.timelimitH,0,0,0)

      var limit=Math.abs((now-next.getTime())/3600000) 
      while(config.shop.order.weekdays.indexOf(next.getDay())<0 || limit<config.shop.order.timelimit){
        next=new Date(next.getTime()+86400000)
        limit=Math.abs((now-next.getTime())/3600000) 
      }

      //
      // we dont care about seconds and ms
      next.setHours(next.getHours(),next.getMinutes(),0,0)
      
      return next;
    }
    
    Order.prototype.findCurrentShippingDay=function(){
      var next=new Date(), now=Date.now();

      // if next is today && next hours >= config.shop.order.timelimitH ==> select next day
      var elpased=Math.abs((now-next.getTime())/3600000) 
      while((config.shop.order.weekdays.indexOf(next.getDay())<0) || 
            (elpased<24 && next.getHours()>config.shop.order.timelimitH)){
        next=new Date(next.getTime()+86400000)
        elpased=Math.abs((now-next.getTime())/3600000)  
      }

      //
      // we dont care about seconds and ms
      next.setHours(next.getHours(),next.getMinutes(),0,0)
      return next
    }

    Order.prototype.getShippingLabels=function(){
        var when=new Date(this.shipping.when);
        var time=config.shop.order.shippingtimes[when.getHours()]
        var date=moment(when).format('dddd DD MMM YYYY', 'fr');
        
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



    Order.prototype.create=function(shipping,items,payment, cb,err){

      if(!err) err=function(){};
      var self=this, s = this.backend.$order.save({shipping:shipping,items:items,payment:payment}, function() {
        self.wrap(s);
        if(cb)cb(self)
      },err);
      return self;
    };    
    

    Order.prototype.findOrdersByUser=function(user,filter){ 
      var self=this;
      return this.chainAll(this.backend.$order.query({id:user.id,action:'users'}).$promise);
    }    


    Order.prototype.findAllOrders=function(filter, cb){
      var self=this;
      return this.chainAll(this.backend.$order.query(filter).$promise);
    }

    Order.prototype.findOrdersByShop=function(shop,filter, cb){
      var self=this;
      var params=angular.extend({},filter||{},{id:shop.urlpath,action:'shops'})
      return this.chainAll(this.backend.$order.query(params).$promise);
    }

    var _order=api.wrapDomain(Order,'oid', defaultOrder);
    return _order;
  }
]);

