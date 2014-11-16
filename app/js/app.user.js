'use strict';

//
// Define the User module (app.user)  for controllers, services and models
// the app.user module depend on app.config and take resources in account/*.html
var User=angular.module('app.user', ['app.config','app.ui.map','app.user.ui']);

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
      .when('/auth/login', {_view:'main', templateUrl : '/partials/auth/login.html'})
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
      .when('/account/dashboard', {_view:'main', templateUrl : '/partials/account/dashboard.html'})
      .when('/account/orders', {_view:'main', templateUrl : '/partials/account/orders.html'})
      .when('/account/email', {auth : true, _view:'main', templateUrl : '/partials/account/email.html'})
      .when('/account/overview', {auth : true, _view:'main', templateUrl : '/partials/account/overview.html'})
      .when('/account/password', {auth : true, _view:'main', templateUrl : '/partials/account/password.html'})
      .when('/account/profile', {auth : true, _view:'main', templateUrl : '/partials/account/profile.html'})
      .when('/account/signup', {view:'main', templateUrl : '/partials/account/profile.html'})

      .when('/admin/user', {title:'Admin of users ', _view:'main', templateUrl : '/partials/admin/user.html'});
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
  'shop',
  '$timeout',
  '$http',

  function (config, $scope, $location, $rootScope, $routeParams, api, user, Map, shop, $timeout, $http) {
    $scope.map=new Map()
    $scope.user=user;
    $scope.reg={}
    $scope.users=[];
    $scope.providers=config.providers;

    $scope.pm={
      'american express':'ae.jpg',
      'mastercard':'mc.jpg',
      'visa':'visa.jpg',
      'postfinance':'pfc.jpg'
    }

    // show payment form
    $scope.showPaymentForm=false;

    // default model for modal view
    $scope.modal = {};

    var cb_error=api.error($scope);

    // get list of users
    if($location.path()==='/admin/user'){
      user.query({}).$promise.then(function(u){
          $scope.users=u
      })
    }

    // remove an user
    $scope.remove=function(user, password){
      user.remove(password,function(){
        api.info($scope,"l'utilisateur est supprimer");
        // remove user from local repository
        for (var i=0;i<$scope.users.length;i++){
          if($scope.users[i].id===user.id)
            $scope.users.splice(i,1)
        }
      },cb_error)
    }

    if($routeParams.id&&$routeParams.email){
      user.validate($routeParams,function(msg){
        api.info($scope,"Votre adresse email à été validée!");
        user.email.status=true;
      },cb_error);
    }

    //
    // check and init the session
    user.me(function(u){
      $scope.user = u;
      u.geo=new Map()
      Raven.setUserContext({ email: user.email })


      user.addresses.forEach(function(address,i){
        user.geo.addMarker(i,{
          lat:address.geo.lat,
          lng:address.geo.lng,
          message:address.streetAdress+'/'+address.postalCode
        });
      })
      angular.extend($scope,user.geo.getMap());
    });

    $scope.modalUserDetails=function(user){
      $scope.modal=user
    }

    $scope.modalDissmiss=function(){
      $scope.modal = {};
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
        // if user profile is not ready?
        if(!user.isReady()||!user.hasPrimaryAddress()){
          return $location.url('/account/profile');
        }

        //
        // else goto '/'
        $location.url('/account/overview');
      }, cb_error);
    };



    //
    // create a new account
    $scope.createAccount=function(u){
      var r={email:u.email.address,firstname:u.name.givenName,lastname:u.name.familyName,
            password:u.password.new,confirm:u.password.copy
      };
      $rootScope.WaitText="Waiting ..."

      user.register(r,function(){
        api.info($scope,"Votre compte à été créé! Une demande de confirmation vous a été envoyé à votre adresse email")
        $location.url('/account/profile');
      },cb_error);
    };

    //
    // create a new shop
    $scope.createShop=function(s){
      $rootScope.WaitText="Waiting ..."
      shop.create(user,s,function(){
          api.info($scope,"Votre boutique à été crée ",function(){
            if ($scope.activeNavId==='/account/shop')
              $location.url('/account/overview');
          });
      },cb_error);
    };



    //
    // save action
    $scope.save=function(u){
      $rootScope.WaitText="Waiting ..."
      user.save(user,function(){
        api.info($scope,"Profile enregistré");
      },cb_error);
    };

    //
    // validate user email
    $scope.changePassword=function(email,password){
      $rootScope.WaitText="Waiting ..."
      password.email=email;
      user.newpassword(password,function(){
        api.info($scope,"Password modifié");
        user.password={};
      },cb_error);
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

      },cb_error);
      return;

    };
    $scope.persona=function(provider){
      navigator.id.get(function (assertion) {
        $http.post(provider.url, {assertion:assertion})
          .then(function (responce) {
            user.me(function(u){
              $scope.FormErrors='';
              var home=(u.email&&u.email.status===true)?
                '/products':'/account/profile'
              $location.url(home);
            })
         },function(error){
          api.info($scope,error);
         });
      });
    }


    $scope.addPaymentMethod=function(name,number,csc,expiry){
      $rootScope.WaitText="Waiting ..."
      user.addPaymentMethod({name:name,number:number,csc:csc,expiry:expiry},function(u){
        api.info($scope,"Votre méthode de paiement a été enregistré");
        user.showCreditCard=false;
      },cb_error)
    }

    $scope.deletePaymentMethod=function(alias,cvc,expiry){
      $rootScope.WaitText="Waiting ..."
      user.deletePaymentMethod(alias,function(u){
        api.info($scope,"Votre méthode de paiement a été supprimé");
      },cb_error)
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
            $scope.FormErrors='';
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

/**
 * this should be usefull to help the display of the primary address
 */
User.filter("primary",function(){
  return function(primary,user){
    if (primary)return primary;
    return (user.addresses.length==1)?'true':'false';
  }
});


/**
 * app.user provides a model for interacting with user.
 * This service serves as a convenient wrapper for other related services.
 */

User.factory('user', [
  'config',
  '$location',
  '$rootScope',
  '$route',
  '$resource',
  '$q',
  'api',
  'shop',

  function (config, $location, $rootScope, $route, $resource, $q, api, shop) {

    var defaultUser = {
      id: '',
      name: {
        givenName: '',
        familyName: '',
      },
      photo:config.user.photo,
      email: '',
      roles: [],
      shops: [],
      provider: '',
      url: '',
      phoneNumbers:[{what:'mobile'}],
      addresses:[{}]
    };



    var User = function(data) {
      this.backend={}
      this.backend.$user=$resource(config.API_SERVER+'/v1/users/:id/:action/:aid/:detail',
              {id:'@id',action:'@action',aid:'@aid',detail:'@detail'}, {
              update: {method:'POST'},
              delete: {method:'PUT'},
      });

      //
      // wrap promise to this object
      this.$promise=$q.when(this)

    }


    User.prototype.display=function(){
        if (this.name && (this.name.givenName || this.name.familyName)) {
          return this.name.givenName+' '+this.name.familyName
        }
        if (this.displayName)return this.displayName;
        if (this.id){
          return this.id+'@'+this.provider;
        }

        return 'Anonymous';
    }


    User.prototype.acronym=function(){
      var d=this.display()
      res=d.match(/\b(\w)/g).join('')
      return (d)?d:'unknow';
    }


    User.prototype.isOwner=function(shopname){

        //if (this.isAdmin())return true;
        for (var i in this.shops) {
          if (this.shops[i].name === shopname) {
            return true;
          }
        }
        return false;
    };

    User.prototype.isOwnerOrAdmin=function(shopname){
      if(this.isAdmin())
        return true;
      return this.isOwner(shopname);
    };

    User.prototype.isAuthenticated= function () {
        return this.id !== '';
    };

    User.prototype.isAdmin= function () {
      return this.hasRole('admin');
    };

    User.prototype.isReady=function(){
      return (this.email&&this.email.status == true)
    }

    User.prototype.hasRole= function (role) {
        for (var i in this.roles){
          if (this.roles[i]===role) return true;
        }
        return false;
    };

    User.prototype.hasLike= function (product) {
        for (var i in this.likes){
          if (this.likes[i].sku==product.sku) return true;
        }
        return false;
    };

    User.prototype.hasPrimaryAddress= function () {
        if (this.addresses&&this.addresses.length==1)return true;
        for (var i in this.addresses){
          if (this.addresses[i].primary===true)
            return i;
        }
        return false;
    }


    User.prototype.getEmailStatus=function(){
      if(!this.email||!this.email.status)
        return false;

      if(this.email.status===true)
        return true;

      return  moment(this.email.status).format('ddd DD MMM YYYY', 'fr');

    }

    User.prototype.populateAdresseName=function(user){
      if (!user)user=this;
      // autofill the address name when available
      if(user.addresses&&user.addresses.length&&!user.addresses[0].name){
        user.addresses[0].name=user.name.familyName+' '+user.name.givenName
      }
    }

    //
    // REST api wrapper
    //

    User.prototype.me = function(cb,err) {
      var self=this;if(!err) err=function(){self.onerr()};
      return this.chain(this.backend.$user.get({id:'me'}, function(_u,headers) {
          self.wrap(_u);
          self.shops=shop.wrapArray(self.shops);
          if(cb)cb(self);
          return self;
        },err).$promise
      );
    };


    User.prototype.query = function(filter,err) {
      if(!err) err=this.onerr;
      self=this;
      return this.chainAll(this.backend.$user.query(filter,function(u){
      },err).$promise);
    };

    User.prototype.validate = function(validation, cb,err) {
      if(!err) err=this.onerr;
      var msg=$resource(config.API_SERVER+'/v1/validate/:id/:email',validation).get( function() {
        if(cb)cb(msg);
      },err);
      return;
    };

    User.prototype.validateEmail = function( cb, err){
      if(!err) err=this.onerr;
      var validate=$resource(config.API_SERVER+'/v1/validate/create').save(function() {
        if(cb)cb(validate);
      },err);
      return validate;
    };

    User.prototype.recover = function(recover, cb, err){
      if(!err) err=this.onerr;
      var d=$resource(config.API_SERVER+'/v1/recover/:token/:email/password',recover).save(function() {
        if(cb)cb(d);
      },err);
      return d;
    };


    User.prototype.save = function(user, cb, err){
      if(!err) err=this.onerr;

      // autofill the address name when available
      this.populateAdresseName(user)

      var u=this.backend.$user.save(user, function() {
        _user.copy(u);
        if(cb)cb(_user);
      },err);
      return u;
    };

    User.prototype.logout=function(cb){
      var u = $resource(config.API_SERVER+'/logout').get( function() {
        _user.copy(defaultUser);
        if(cb)cb(_user);
      });
      return u;
    };

    User.prototype.register=function (user, cb,err){
      if(!err) var err=function(){};

      // autofill the address name when available
      this.populateAdresseName(user)

      var u = $resource(config.API_SERVER+'/register').save(user, function() {
        _user.copy(u);

        if(cb)cb(_user);
      },err);
      return u;
    };

    User.prototype.newpassword=function (change, cb,err){
      if(!err) var err=function(){};
      var _user=this, u = this.backend.$user.save({id:this.id,action:'password'},change, function() {
        if(cb)cb(_user);
      },err);
      return u;
    };

    User.prototype.login=function (data, cb,err){
      if(!err) var err=this.onerr;
      var u = $resource(config.API_SERVER+'/login').save(data, function() {
        _user.copy(u);

        if(cb)cb(_user);
      },err);
      return u;
    };

    //
    // TODO move this action to the shop service
    User.prototype.createShop=function(shop,cb,err){
      if(!err) var err=function(){};
      var s = $resource(config.API_SERVER+'/v1/shops').save(shop, function() {
        _user.shops.push(s);
        if(cb)cb(_user);
      },err);
      return s;
    };

    User.prototype.remove=function(password,cb,err){
      if(!err) var err=function(){};
      var self=this, u=this.backend.$user.delete({id:this.id},{password:password}, function() {
        self.delete()
        cb()
      },err);
    }


    User.prototype.love=function(product,cb,err){
      var self=this;
      if(!err) var err=function(){}, params={};
      var u = this.backend.$user.save({id:this.id,action:'like',aid:product.sku}, function() {
        self.copy(u);
        if(cb)cb(self);
      },err);
      return this;
    };


    /**
     * payment methods
     */
    User.prototype.addPaymentMethod=function(payment,cb,err){
      var self=this;
      if(!err) var err=function(){}, params={};
      this.backend.$user.save({id:this.id,action:'payment'},payment, function(u) {
        self.payments=u.payments
        if(cb)cb(self);
      },err);
      return this;
    };

    User.prototype.deletePaymentMethod=function(alias,cb,err){
      var self=this;
      if(!err) var err=function(){}, params={};
      this.backend.$user.save({id:this.id,action:'payment',aid:alias,detail:'delete'}, function() {
        for(var p in self.payments){
          if(self.payments[p].alias===alias){
            self.payments.splice(p,1)
          }
        }
        if(cb)cb(self);
      },err);
      return this;
    };


    //
    //default singleton for user
    var _user=api.wrapDomain(User,'id', defaultUser);
    return _user;
  }
]);
