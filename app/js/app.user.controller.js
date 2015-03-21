;(function(angular) {'use strict';

//
// Define the User module (app.user)  for controllers, services and models
// the app.user module depend on app.config and take resources in account/*.html
var User=angular.module('app.user', 
  ['app.config','app.ui.map','app.user.ui','postfinance.card']);

//
// define all routes for user api
User.config([
  '$routeProvider',
  '$locationProvider',
  '$httpProvider',

  function ($routeProvider, $locationProvider, $httpProvider) {

    // List of routes of the application
    $routeProvider
      // Authentication
      .when('/auth', {redirectTo : '/auth/login'})
      .when('/signup', {title:'Créer votre compte', _view:'main', templateUrl : '/partials/account/signup.html'})
      .when('/login', {title:'Login', _view:'main', templateUrl : '/partials/account/login.html'})
      .when('/validate/:id/:email', {title:'Email Validation', templateUrl : '/partials/account/validate.html'})
      .when('/recovery', { _view:'main', templateUrl : '/partials/account/recovery.html'})

      // Account
      // `auth : true` is a custom value passed to current route
      .when('/account', {title:'Votre profil', _view:'main',redirectTo : '/account/overview'})
      .when('/account/', {title:'Votre profil', _view:'main', redirectTo : '/account/overview'})
      .when('/account/love', {_view:'main', love:true, templateUrl : '/partials/product/love.html'})
      .when('/account/shop', {_view:'main', templateUrl : '/partials/account/shop.html'})
      .when('/account/payment', {_view:'main', templateUrl : '/partials/account/payment.html'})
      .when('/account/orders', {_view:'main', templateUrl : '/partials/account/orders.html'})
      .when('/account/overview', {auth : true, _view:'main', templateUrl : '/partials/account/overview.html'})
      .when('/account/password', {auth : true, _view:'main', templateUrl : '/partials/account/password.html'})
      .when('/account/profile', {auth : true, _view:'main', templateUrl : '/partials/account/profile.html'})
      .when('/account/signup', {view:'main', templateUrl : '/partials/account/profile.html'})

      .when('/admin/config', {title:'Configuration ', templateUrl : '/partials/dashboard/dashboard-config.html'})
      .when('/admin/user', {title:'Admin of users ', templateUrl : '/partials/admin/user.html'});
  }
]);


//
// Define the application level controllers
// the AccountCtrl is used in account/*.html
User.controller('AccountCtrl',[
  'config',
  '$scope',
  '$location',
  '$rootScope',
  '$routeParams',
  'api',
  'user',
  'Map',
  'Cards',
  'shop',
  '$timeout',
  '$http',

  function (config, $scope, $location, $rootScope, $routeParams, api, user, Map, Cards, shop, $timeout, $http) {
    $scope.map=new Map()
    $scope.user=user;
    $scope.Cards=Cards;
    $scope.config=config
    $scope.reg={}
    $scope.users=[];
    $scope.providers=config.providers;

    $scope.pm={
      'american express':'ae.jpg',
      'mastercard':'mc.jpg',
      'visa':'visa.jpg',
      'postfinance card':'pfc.jpg'
    }

    // show payment form
    $scope.options={
      showCreditCard:false,
      showPaymentForm:false
    }

    // default model for modal view
    $scope.modal = {};


    // remove an user
    $scope.remove=function(user, password){
      user.remove(password,function(){
        api.info($scope,"l'utilisateur est supprimer");
        // remove user from local repository
        for (var i=0;i<$scope.users.length;i++){
          if($scope.users[i].id===user.id)
            $scope.users.splice(i,1)
        }
      })
    }

    //
    // check and init the session
    user.me(function(u){
      $scope.user = u;
      angular.extend($scope,user.geo.getMap());
    });

    $scope.modalUserDetails=function(user){
      $scope.modal=user
    }

    $scope.modalDissmiss=function(){
      $scope.modal = {};
    }

    //
    // list all users
    // get list of users
    $scope.findAllUsers=function(){
      user.query({}).$promise.then(function(u){
          $scope.users=u
      })
    }

    //
    // login action
    $scope.login= function(email,password){
      $rootScope.WaitText="Waiting ..."
      user.login({ email: email, password:password, provider:'local' },function(u){
        api.info($scope,"Merci, vous êtes dès maintenant connecté");

        //
        // if referer is in protected path?
        if($scope.referrer&&_.find(config.loginPath,function(path){
            return ($scope.referrer.indexOf(path)!==-1)})){
          return $location.url($scope.referrer);
        }

        //
        // if user manage his shop
        if(user.shops.length ||user.isAdmin()){
          return $location.url('/admin/orders');
        }

        // console.log(user.roles,user.hasRole('logistic'))
        //
        // user is a shopper 
        if(user.hasRole('logistic')){
          return $location.url('/admin/shipping');
        }

        //
        // else goto '/'
        $location.url('/');
      });
    };

    $scope.validateEmail=function(){
      if($routeParams.id&&$routeParams.email){
        user.validate($routeParams,function(msg){
          api.info($scope,"Votre adresse email à été validée!");
          user.email.status=true;

          //
          // user is a shopper 
          if(user.hasRole('logistic')){
            return $location.url('/admin/shipping');
          }

        });
      }
    }


    //
    // create a new account
    $scope.createAccount=function(u){
      var r={email:u.email.address,firstname:u.name.givenName,lastname:u.name.familyName,
            password:u.password.new,confirm:u.password.copy
      };
      $rootScope.WaitText="Waiting ..."

      user.register(r,function(){
        api.info($scope,"Votre compte à été créé! Une demande de confirmation vous a été envoyée à votre adresse email")
        $location.url('/account/profile');
      });
    };

    //
    // create a new shop
    $scope.createShop=function(s){
      $rootScope.WaitText="Waiting ..."
      shop.create(user,s,function(){
          api.info($scope,"Votre boutique à été créée ",function(){
            if ($scope.activeNavId==='/account/shop')
              $location.url('/account/overview');
          });
      });
    };



    //
    // save action
    $scope.save=function(u){
      $rootScope.WaitText="Waiting ..."
      user.save(user,function(){
        api.info($scope,"Profil enregistré");
      });
    };

    //
    // validate user email
    $scope.changePassword=function(email,password){
      $rootScope.WaitText="Waiting ..."
      password.email=email;
      user.newpassword(password,function(){
        api.info($scope,"Password modifié");
        user.password={};
        $location.url('/account/profile');
      });
    };


    //
    // recover user pass
    $scope.recover=function(email){
      $rootScope.WaitText="Waiting ..."
      user.recover({token:'Zz7YkTpPPp5YFQnCprtc7O9',email:email},function(){
        api.info($scope,"Merci, une information a été envoyé à votre adresse email");
          if (!user.isAuthenticated())
            $location.url('/login');
          else
            $location.url('/account/profile');
      });
      return;

    };
    $scope.persona=function(provider){
      navigator.id.get(function (assertion) {
        $http.post(provider.url, {assertion:assertion})
          .then(function (responce) {
            user.me(function(u){
              $scope.FormErrors=false;
              var home=(u.email&&u.email.status===true)?
                '/products':'/account/profile'
              $location.url(home);
            })
         },function(error){
          api.info($scopeor);
         });
      });
    }


    $scope.addPaymentMethod=function(name,number,csc,expiry){
      $rootScope.WaitText="Waiting ..."
    if(!expiry){
      $rootScope.WaitText=false
      return api.info($scope,"Date non valide!");
    }
    if(!csc){
      $rootScope.WaitText=false
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
          $rootScope.WaitText=false
          return api.info($scope,response.error.message);
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
          $rootScope.WaitText=false
          $scope.options.showCreditCard=false;
        })

      });      
    }


    $scope.checkPaymentMethod=function(){
      $rootScope.WaitText="Waiting ..."
      $scope.methodStatus={}
      user.$promise.then(function () {
        user.checkPaymentMethod(function(methodStatus){
          $scope.methodStatus=methodStatus;
        })
      })
    }

    $scope.deletePaymentMethod=function(alias,cvc,expiry){
      $rootScope.WaitText="Waiting ..."
      user.deletePaymentMethod(alias,function(u){
        api.info($scope,"Votre méthode de paiement a été supprimé");
      })
    }

    $scope.ecommerceForm=function(){
      $rootScope.WaitText="Waiting ..."
      user.pspForm(function(u){
        
      })
    }

    $scope.updateStatus=function(id,status){
      $rootScope.WaitText="Waiting ..."
      user.updateStatus(id,status,function(){
        api.info($scope,"Le status à été modifié");
      })
    }


    // Functions
    // Open a popup to authenticate users with Auth, and redirect to account page on success
    $scope.authenticate = function (provider, w, h) {
      // default values for parameters
      w = w || 400;
      h = h || 350;

      var url = provider.url,
        left = (screen.width / 2) - (w / 2),
        top = (screen.height / 2) - (h / 2),
        targetWin = window.open(url, 'authWindow', 'toolbar=no, location=1, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);
      function tick() {
        var p = targetWin.location;
          if (!p||p===undefined)return;
          //
          // simple check of session
          user.me(function(u){
            targetWin.close();
            $scope.FormErrors=false;
            var home=(u.email&&u.email.status===true)?
              '/products':'/account/profile'
            $location.url(home);
          },function(e){
            // still not connected
            $scope.FormErrors=('Wainting...');
            $timeout(tick, 2000);
          });

      };
      $timeout(tick, 3000);

    };

    //
    // geomap init
    $scope.updateMap=function(address){
      if (address.streetAdress===undefined||address.postalCode===undefined)
       return;

      user.geo.geocode(address.streetAdress, address.postalCode, address.country, function(geo){
        if(!geo.results.length||!geo.results[0].geometry){
         return;
        }
        //
        //update data
        address.geo={};
        address.geo.lat=geo.results[0].geometry.location.lat;
        address.geo.lng=geo.results[0].geometry.location.lng;
        //
        // map init
        var fullAddress=address.streetAdress+'/'+address.postalCode;
        user.geo.addMarker(user.addresses.length, {lat:address.geo.lat,lng:address.geo.lng, message:fullAddress});
        //angular.extend($scope,user.geo.getMap());

      })
    };



    // if(user.geo && user.addresses){

    //   user.addresses.forEach(function(address,i){
    //     if (address.geo)
    //     user.geo.addMarker(i,{
    //       lat:address.geo.lat,
    //       lng:address.geo.lng,
    //       message:address.streetAdress+'/'+address.postalCode
    //     });
    //   })
    //   angular.extend($scope,user.geo.getMap());
    // } else angular.extend($scope,new Map().getMap());
  }
]);

})(window.angular);
