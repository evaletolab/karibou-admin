;(function(angular) {'use strict';

//
// Define the Order module (app.shop)  for controllers, services and models
// the app.shop module depend on app.config and take resources in shop/*.html
var Order=angular.module('app.order', [
  'app.order.ui',
  'app.config',
  'app.api',
  'app.order.admin',
  'postfinance.card'
]);

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
      .when('/admin/orders', {title:'List next orders ',  templateUrl : '/partials/account/dashboard.html', controller:'OrderAdminCtrl'})
      .when('/admin/order', {title:'Admin of order ',  templateUrl : '/partials/admin/order.html'});
  }
]);


Order.controller('OrderNewCtrl',[
  '$scope','$location','$rootScope','$routeParams','api','Cards','order','cart','user','product','Map','config','$log',
  function ($scope, $location, $rootScope,$routeParams, api, Cards, order, cart, user, product, Map, config,  $log) {
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
    $scope.Cards=Cards;
    $scope.profileReady=(user.isReady()&&user.hasPrimaryAddress())

    // default model for modal view
    $scope.modal = {};

    $scope.pm={
      'american express':'ae.jpg',
      'mastercard':'mc.jpg',
      'visa':'visa.jpg',
      'postfinance':'pfc.jpg'
    }


    //
    // state of the flow
    $scope.process=$routeParams.process;

    //
    // initial flow
    // user.anon && profile   => /order/identity
    // user.anon              => /order/identity
    // !user.ready            => /order/profile
    // user.ready && !process => /order/payment
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
        $location.path('/order/payment')
      }else if($scope.process==='identity'){
        $location.path('/order/profile')
      }else if($scope.process=='validation' && !cart.config.payment){
        $location.path('/order/payment')
      }
    // });

    //
    // init order fields
    user.$promise.then(function(){
      var p=user.hasPrimaryAddress();
      $scope.cart.config.address=(p!=-1)?p:0;
      if(!user.addresses.length)user.addresses.push({})
      if(!user.phoneNumbers.length)user.phoneNumbers.push({})
      $log.debug("user data ready for order",user.addresses)
    })

    config.shop.then(function(){
      $scope.shippingDays=order.findOneWeekOfShippingDay();
      if($scope.shipping)
        return
      $scope.shipping=order.findCurrentShippingDay();
    })


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
            api.info($scope,"Votre profil est enregistré");
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


    $scope.addPaymentMethod=function(name,number,csc,expiry){
      $rootScope.WaitText="Waiting ..."
      user.addPaymentMethod({name:name,number:number,csc:csc,expiry:expiry},function(u){
        api.info($scope,"Votre méthode de paiement a été enregistrée");
        user.showCreditCard=false;
      },cb_error)
    }

    $scope.deletePaymentMethod=function(alias,cvc,expiry){
      $rootScope.WaitText="Waiting ..."
      user.deletePaymentMethod(alias,function(u){
        api.info($scope,"Votre méthode de paiement a été supprimée");
      },cb_error)
    }


    $scope.currentFlow=function(flow){

      return flow.indexOf($scope.process)>-1
    }

    $scope.updateFlow=function(flow){
      $location.search('process',flow)
    }

    //
    // set cart tax and return payment label
    $scope.updateGatewayFees=function(){
      if(!cart.config.payment)return 0
      for(var p in config.shop.order.gateway){
        if(config.shop.order.gateway[p].label===cart.config.payment.type){
          cart.setTax(config.shop.order.gateway[p].fees, config.shop.order.gateway[p].label)
          return config.shop.order.gateway[p].label;
        }
      }
    }


    $scope.terminateOrder=function(){
      $rootScope.WaitText="Waiting..."

      $log.debug("order.config",cart.config)
      $log.debug("order.dates",$scope.shippingDays)
      $log.debug("order.address",cart.config.address)
      $log.debug("order.fees",cart.taxName(),cart.tax())

      //
      // prepare shipping
      var shipping=cart.config.address;
      shipping.when=new Date($scope.shippingDays[cart.config.shipping||0].when);


      //
      // prepare items
      var items=$scope.cart.items;

      //
      // get payment token
      var payment={
        alias:cart.config.payment.alias,
        issuer:cart.config.payment.type,
        number:cart.config.payment.number
      };

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
        $location.path('/')
      },cb_error)
    }


    $scope.getItem=function(sku){
      return cart.findBySku(sku)
    }
  }
]);

})(window.angular);
