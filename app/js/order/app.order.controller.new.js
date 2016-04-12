(function(angular) {'use strict';

//
// Define the Order module (app.order)  for controllers, services and models
angular.module('app.order.new', ['app.order.ui','app.config', 'app.api'])
  .controller('OrderNewCtrl',OrderNewCtrl);



//
// implement 
OrderNewCtrl.$inject=['$controller','$scope','$location','$rootScope','$timeout','$routeParams','api','Cards','order','cart','user','product','Map','config','$log'];
function OrderNewCtrl($controller, $scope, $location, $rootScope, $timeout, $routeParams, api, Cards, order, cart, user,product,Map,config,$log) {

  $controller('OrderCommonCtrl', {$scope: $scope}); 

  $scope.cart=cart;
  $scope.errors=false;
  $scope.orders=[];
  $scope.products=[];
  $scope.filters={};
  $scope.shops=false;
  $scope.profileReady=false;
  $scope.Cards=Cards;
  $scope.options={
    showCreditCard:false,
    showPaymentOptions:false
  };
  
  // default model for modal view
  $scope.modal = {};

  $scope.pm={
    'american express':'ae.jpg',
    'mastercard':'mc.jpg',
    'visa':'visa.jpg',
    'postfinance card':'pfc.jpg',
    'invoice':'bvr.jpg',
    'wallet':'wallet.jpg'
  };


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
  user.$promise.finally(function(){
    $scope.profileReady=(user.isReady()&&(user.hasPrimaryAddress()!==false));
    $log.info('in flow',$scope.process, $scope.profileReady, cart.config.payment);  

    if(!user.isAuthenticated() && $scope.process==='profile'){
      $location.path('/order/profile');
    }else if(!user.isAuthenticated()){
      $location.path('/order/identity');
    }else if(!$scope.profileReady){
      $location.path('/order/profile');
      //
      // the profile is now ok
    }else if(!$scope.process){
      $location.path('/order/payment');
    }else if($scope.process==='identity'){
      $location.path('/order/profile');
    }else if($scope.process=='validation' && !cart.config.payment){
      $location.path('/order/payment');
    }




    var p=user.hasPrimaryAddress();
    $scope.cart.config.address=(p!=-1)?p:0;

    $log.info('out flow',$scope.process,$scope.cart.config);  

    // create an empty address to prefil the form in the wizard
    //if(!user.addresses.length)user.addresses.push({})
    if(!user.phoneNumbers.length)user.phoneNumbers.push({what:'mobile'});
    $log.info("user data ready for order",user.addresses);
  });

  config.shop.then(function(){
    if($scope.shipping)
      return;
    $scope.shipping=order.findCurrentShippingDay();
  });


  //
  // geomap init
  $scope.updateMap=function(address, cb){
    $log.info('update map done',address);
    if (!address||address.streetAdress===undefined||address.postalCode===undefined)
     return cb&&cb("Vous n'avez pas rempli le formulaire avec l'adresse");

    $scope.map.geocode(address.streetAdress, address.postalCode, address.country, function(geo){
      if(!geo.results.length||!geo.results[0].geometry){
        // issue with geocode, anyways continue
        if(cb)cb(null,address);
       return;
      }
      //
      //update data
      address.geo={};
      address.geo.lat=geo.results[0].geometry.location.lat;
      address.geo.lng=geo.results[0].geometry.location.lng;
      if(cb)cb(null,address);
    });
  };

  //
  // if user => save profile
  // if !user=> register+save profile
  $scope.saveIdentity=function(u){
    $rootScope.WaitText="Waiting ...";
    $log.info('populate address ');
    user.populateAdresseName(u);

    $log.info('update map');
    $scope.updateMap(u.addresses[0],function(err,address){
      if(err){
        $rootScope.WaitText=false;
        return api.info($scope,err);
      }

      if(user.isAuthenticated()){
        return user.save(u,function(){
          api.info($scope,"Votre profil est enregistré");
          $location.path("/order/validation");
        });
      }
      // else , register a new and complete profile
      var reg={email:u.email.address,firstname:u.name.givenName,lastname:u.name.familyName,
            password:u.password.new,confirm:u.password.copy,
            addresses:u.addresses,
            phoneNumbers:u.phoneNumbers
      };

      user.register(reg,function(){
        api.info($scope,"Merci, votre compte à été créé! Une demande de confirmation vous a été envoyée à votre adresse email");
        $location.url('/order/validation');
      });
    });
  };




  $scope.verify=function(user){
    $rootScope.WaitText="Waiting ...";
    user.validateEmail(function(validate){
      api.info($scope,"Merci, une confirmation a été envoyée à votre adresse email");
      if (!user.isAuthenticated())
        $location.url('/');
    });
  };


  //
  // login action
  $scope.login= function(email,password){
    $rootScope.WaitText="Waiting ...";
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
    });
  };


  $scope.selectPaymentMethod=function (method) {
    $scope.options.showCreditCard=false;
    if($scope.methodStatus[method.alias]){
      return; 
    }
    cart.config.payment=method;
  };

  $scope.checkPaymentMethod=function(){
    $rootScope.WaitText="Waiting ...";
    $scope.methodStatus={};
    //
    // wait for user should not be there???
    user.$promise.then(function () {
      //
      // check payment method with our gateway
      user.checkPaymentMethod(function(methodStatus){
        $scope.methodStatus=methodStatus;
        // 
        // select the default payment method
        user.payments.every(function (method) {
          if(Object.keys(methodStatus).indexOf(method.alias)===-1){
            cart.config.payment=method;
            return;
          }
        });
      });
    });
  };

  $scope.addPaymentMethod=function(name,number,csc,expiry){
    $rootScope.WaitText="Waiting ...";
    if(!expiry){
      $rootScope.WaitText=false;
      return api.info($scope,"Date non valide!");
    }
    if(!csc){
      $rootScope.WaitText=false;
      return api.info($scope,"CVC non valide!");
    }
    Stripe.card.createToken({
      name:name,
      number: number,
      cvc: csc,
      exp_month: expiry.split('/')[0],
      exp_year: expiry.split('/')[1]
    }, function (status, response) {
      if(response.error){
        $rootScope.WaitText=false;
        $timeout(function() {
        api.info($scope,response.error.message);          
        }, 100);
        return
      }
      //
      // response.id
      user.addPaymentMethod({
        id:response.id,
        name:response.card.name,
        issuer:response.card.brand.toLowerCase(),
        number:'xxxx-xxxx-xxxx-'+response.card.last4,
        expiry:response.card.exp_month+'/'+response.card.exp_year
      },function(u){
        api.info($scope,"Votre méthode de paiement a été enregistrée");
        $rootScope.WaitText=false;
        $scope.options.showCreditCard=false;

        //
        // select the last as default method
        if(user.payments.length>0){
          cart.config.payment=user.payments[user.payments.length-1];
        }
      });

    });      
  };

  $scope.currentFlow=function(flow){
    return flow.indexOf($scope.process)>-1;
  };

  $scope.updateFlow=function(flow){
    $location.search('process',flow);
  };

  //
  // set cart tax and return payment label
  $scope.updateGatewayFees=function(){
    if(!cart.config.payment)return 0;
    for(var p in config.shop.order.gateway){
      if(config.shop.order.gateway[p].label===cart.config.payment.issuer){
        cart.setTax(config.shop.order.gateway[p].fees, config.shop.order.gateway[p].label);
        return config.shop.order.gateway[p].label;
      }
    }
  };


  $scope.terminateOrder=function(){
    $rootScope.WaitText="Waiting...";

    $log.debug("order.config",cart.config);
    $log.debug("order.dates",config.shippingweek);
    $log.debug("order.address",cart.config.address);
    $log.debug("order.fees",cart.taxName(),cart.tax());

    //
    // prepare shipping
    var shipping=cart.config.address;
    shipping.when=(config.shop.shippingweek[cart.config.shipping]);
    shipping.hours=16;//config.shop.order.shippingtimes;


    //
    // prepare items
    var items=$scope.cart.items;

    //
    // get payment token
    var payment={
      alias:cart.config.payment.alias,
      issuer:cart.config.payment.issuer,
      name:cart.config.payment.name,
      number:cart.config.payment.number
    };

    // clear error
    order.errors=undefined;
    cart.clearErrors();
    order.create(shipping,items,payment,function(order){
      if(order.errors){
        cart.setError(order.errors);
        return;
      }

      //
      // reset accepted CG by user
      $scope.cg=false;

      var labels=order.getShippingLabels();

      var when=labels.date+" entre "+labels.time;
      //
      // empty the current cart to avoid multiple order
      cart.empty();
      api.info($scope, "Votre  commande est enregistrée, vous serez livré le "+when,8000);
      $location.path('/account/orders');
    });
  };


  $scope.getItem=function(sku){
    return cart.findBySku(sku);
  };
}



})(window.angular);
