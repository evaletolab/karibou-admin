'use strict';

//
// Define the User module (app.user)  for controllers, services and models
// the app.user module depend on app.config and take resources in account/*.html 
var User=angular.module('app.user', ['app.config', 'google-maps']);

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
      .when('/validate/:uid/:email', {title:'Email Validation', templateUrl : '/partials/account/overview.html'})

      // Account
      // `auth : true` is a custom value passed to current route
      .when('/account', {title:'Votre profile', _view:'main',redirectTo : '/account/overview'})
      .when('/account/', {title:'Votre profile', _view:'main', redirectTo : '/account/overview'})
      .when('/account/recovery', { _view:'main', templateUrl : '/partials/account/recovery.html'})
      .when('/account/shop', {_view:'main', templateUrl : '/partials/account/shop.html'})
      .when('/account/email', {auth : true, _view:'main', templateUrl : '/partials/account/email.html'})
      .when('/account/overview', {auth : true, _view:'main', templateUrl : '/partials/account/overview.html'})
      .when('/account/connected', {auth : true, _view:'main', templateUrl : '/partials/account/connected.html'})
      .when('/account/password', {auth : true, _view:'main', templateUrl : '/partials/account/password.html'})
      .when('/account/profile', {auth : true, _view:'main', templateUrl : '/partials/account/profile.html'})
      .when('/account/signup', {view:'main', templateUrl : '/partials/account/profile.html'})
  }
]);


//
// Define the application level controllers
// the AccountCtrl is used in account/*.html 
User.controller('AccountCtrl',[
  'config',
  '$scope',
  '$location',
  '$routeParams',
  'api',
  'user',
  'shop',
  '$timeout',
  '$http',
  
  function (config, $scope, $location, $routeParams, api, user, shop, $timeout, $http) {
    $scope.FormErrors=false;
    $scope.user=user;
    $scope.providers=config.providers;
    
    var cb_error=api.error($scope);


    if($routeParams.uid&&$routeParams.email){
      user.validate($routeParams,function(msg){
        api.info($scope,"Votre adresse email à été validée!");
      });
    }

    //
    // check and init the session    
    user.me(function(u){
      $scope.user = u;
    }, function(){
        // on error,
        // if anonymous then redirect to login except for ...
        if($location.path()==='/signup'||$location.path()==='/account/recovery')return;
        $location.path('/login');
    });

    //
    // login action
    $scope.login= function(email,password){
      user.login({ email: email, password:password, provider:'local' },function(u){

        var home=(u.email&&u.email.status===true)?
          '/account':'/account/profile'
        $location.url(home);
      }, cb_error);
    };


    //
    // create a new account
    $scope.createAccount=function(u){
      var r={
        email:u.email.address,
        firstname:u.name.givenName,
        lastname:u.name.familyName,
        password:u.password.new,
        confirm:u.password.new
      };
      
      user.register(r,function(){
        api.info($scope,"Votre compte à été créé! Vous pouvez vous connecter dès maintenant",function(){
          $location.url('/login');
        });
      },cb_error);
    };
    
    //
    // create a new shop
    $scope.createShop=function(s){
      shop.create(user,s,function(){
          api.info($scope,"Votre boutique à été crée ",function(){
            if ($scope.activeNavId==='/account/shop')
              $location.url('/account/overview');
          });
      },cb_error);
    };

    $scope.deleteShop=function(shop){
      shop.remove(user,function(){
          api.info($scope,"Votre boutique à été supprimée");
      },cb_error);
    };
    
    
    //
    // save action
    $scope.save=function(u){
      user.save(user,function(){
        api.info($scope,"Profile enregistré");
      },cb_error);
    };
    
    $scope.deleteUser=function(u){
      //TODO
    };

    //
    // validate user email
    $scope.changePassword=function(email,password){
      password.email=email;
      user.newpassword(password,function(){
        api.info($scope,"Password modifié");
        user.password={};
      },cb_error);
    };    
    
    //
    // validate user email
    $scope.verify=function(u){
      user.save(user,function(){
        user.validateEmail(function(validate){
          api.info($scope,"Merci, une confirmation a été envoyé à cette adresse email");
        });
      },cb_error);
      return;
      
    };


    $scope.updateMap=function(address){
      if (address.streetAdress===undefined||address.postalCode===undefined)
        return;
      // google format: Route de Chêne 34, 1208 Genève, Suisse
      var fulladdress=address.streetAdress+","+address.postalCode+", Suisse";//"34+route+de+chêne,+Genève,+Suisse";
      var url="http://maps.googleapis.com/maps/api/geocode/json?address="+fulladdress+"&sensor=false" ;
      
      /* */
      $http.get(url,{withCredentials:false}).success(function(geo,status,header,config){
        if(!geo.results.length||!geo.results[0].geometry){
          return;
        }

        //
        //update data
        address.location={};
        address.location.lat=geo.results[0].geometry.location.lat;
        address.location.lng=geo.results[0].geometry.location.lng;
        //
        user.gmap(address);
        //
        // map init
        angular.extend($scope, {

          /** the initial center of the map */
          centerProperty: {
            latitude:geo.results[0].geometry.location.lat,
            longitude:geo.results[0].geometry.location.lng
          },

          /** the initial zoom level of the map */
          zoomProperty: 16,

          /** list of markers to put in the map */
          markersProperty: [ {
	            latitude: geo.results[0].geometry.location.lat,
	            longitude:geo.results[0].geometry.location.lng
            }],

          // These 2 properties will be set when clicking on the map
          clickedLatitudeProperty: null,	
          clickedLongitudeProperty: null,
        });


      }).error(function(geo, status, headers, config){
         alert("error on address lookup :"+status);
      }); 


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
              '/account':'/account/profile'
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
    // map init
    angular.extend($scope, {

      /** the initial center of the map */
      centerProperty: {
        latitude:0,
        longitude:0
      },

      /** the initial zoom level of the map */
      zoomProperty: 8,

      /** list of markers to put in the map */
      markersProperty: [ {
          latitude: 34,
          longitude:-34
        }],

      // These 2 properties will be set when clicking on the map
      clickedLatitudeProperty: null,	
      clickedLongitudeProperty: null,
    });
    
    
  }  
]);

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
  'shop',

  function (config, $location, $rootScope, $route, $resource, shop) {
    
    
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
      addresses:[]
    };
    
    //
    // default behavior on error
    var onerr=function(data,config){
      _user.copy(defaultUser);
    };
    
    var User = function(data) {
      angular.extend(this, defaultUser, data);
    }
    
    User.prototype.gmap=function(address){
      address.gmap={};
      address.gmaps=[];
      address.gmaps.push(address.gmap);
      address.gmap.latitude=address.location.lat;
      address.gmap.longitude=address.location.lng;
    }

    User.prototype.copy = function(data) {
        angular.extend(this, data);
        //
        // formating properties for the widget
        for (var i in this.addresses){          
          this.gmap(this.addresses[i]);
        }
    };


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
    
    User.prototype.hasRole= function (role) {
        for (var i in this.roles){
          if (this.roles[i]===role) return true;
        }
        return false;
    };

    //
    // REST api wrapper
    //

    User.prototype.me = function(cb,err) {
      if(!err) err=onerr;
      var u=$resource(config.API_SERVER+'/v1/users/me').get( function() {
        _user.copy(u);
        _user.shops=shop.map(_user.shops);
        if(cb)cb(_user);
      },err);
      return u;
    };

    User.prototype.validate = function(validation, cb,err) {
      if(!err) err=onerr;
      var msg=$resource(config.API_SERVER+'/v1/validate/:uid/:email',validation).get( function() {
        if(cb)cb(msg);
      },err);
      return;
    };

    User.prototype.validateEmail = function( cb, err){
      if(!err) err=onerr;
      var validate=$resource(config.API_SERVER+'/v1/validate/create').save(function() {
        if(cb)cb(validate);
      },err);
      return validate;
    };


    User.prototype.save = function(user, cb, err){
      if(!err) err=onerr;
      var u=$resource(config.API_SERVER+'/v1/users/:id',{id:_user.id}).save(user, function() {
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
      var u = $resource(config.API_SERVER+'/register').save(user, function() {
        if(cb)cb(_user);
      },err);
      return u;
    };

    User.prototype.newpassword=function (change, cb,err){

      if(!err) var err=function(){};
      var _user=this, u = $resource(config.API_SERVER+'/v1/users/:id/password',{id:_user.id}).save(change, function() {
        if(cb)cb(_user);
      },err);
      return u;
    };

    User.prototype.login=function (data, cb,err){
      if(!err) var err=onerr;
      var u = $resource(config.API_SERVER+'/login').save(data, function() {
        _user.copy(u);
        if(cb)cb(_user);
      },err);
      return u;
    };
    
    User.prototype.createShop=function(shop,cb,err){
      if(!err) var err=function(){};
      var s = $resource(config.API_SERVER+'/v1/shops').save(shop, function() {
        _user.shops.push(s);
        if(cb)cb(_user);
      },err);
      return s;
    };    


   
    //
    //default singleton for user  
    var     _user=new User({});
    return _user;  
  }
]);

