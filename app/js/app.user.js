'use strict';

//
// Define the User module (app.user)  for controllers, services and models
// the app.user module depend on app.config and take resources in account/*.html 
var User=angular.module('app.user', ['app.config']);

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
      .when('/auth/login', {templateUrl : '/partials/auth/login.html'})
      .when('/signup', {title:'Créer votre compte', templateUrl : '/partials/account/signup.html'})
      .when('/login', {title:'Login', templateUrl : '/partials/account/login.html'})

      // Account
      // `auth : true` is a custom value passed to current route
      .when('/account', {title:'Votre profile',redirectTo : '/account/overview'})
      .when('/account/', {title:'Votre profile', redirectTo : '/account/overview'})
      .when('/account/recovery', { templateUrl : '/partials/account/recovery.html'})
      .when('/account/shop', {templateUrl : '/partials/account/shop.html'})
      .when('/account/email', {auth : true, templateUrl : '/partials/account/email.html'})
      .when('/account/overview', {auth : true, templateUrl : '/partials/account/overview.html'})
      .when('/account/connected', {auth : true, templateUrl : '/partials/account/connected.html'})
      .when('/account/password', {auth : true, templateUrl : '/partials/account/password.html'})
      .when('/account/profile', {auth : true, templateUrl : '/partials/account/profile.html'})
      .when('/account/signup', {templateUrl : '/partials/account/profile.html'})
  }
]);


//
// Define the application level controllers
// the AccountCtrl is used in account/*.html 
User.controller('AccountCtrl',[
  'config',
  '$scope',
  '$location',
  'api',
  'user',
  'shop',
  '$timeout',
  '$resource',
  
  function (config, $scope, $location, api, user, shop, $timeout, $resource) {
    $scope.FormErrors=false;
    $scope.user=user;
    $scope.providers=config.providers;
    
    var cb_error=api.error($scope);


    //
    // check and init the session    
    user.me(function(u){
      $scope.user = u;
    }, function(){
        // on error,
        // if anonymous then redirect to login except for ...
        if($location.path()==='/signup'||$location.path()==='/account/recovery')return;
        $location.url('/login');
    });

    //
    // login action
    $scope.login= function(email,password){
        user.login({ email: email, password:password, provider:'local' },function(u){          
        $location.url('/account');
      }, cb_error);
    };

    //
    // save action
    $scope.save=function(u){
      user.save(u,function(){
        $scope.FormErrors="";
        $scope.FormInfos="Saved!";
      },cb_error);
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
        $scope.FormInfos="Successfully registered! Please login";
        $location.url('/login');
      },cb_error);
    };
    
    //
    // create a new shop
    $scope.createShop=function(s){
      shop.create(user,s,function(){
          $scope.FormInfos="Successfully created";
      },cb_error);
    };
    
    $scope.deleteUser=function(u){
      //TODO
    };
    
    
    //
    // validate user email
    $scope.verify=function(u){
      u.validateEmail(function(validate){
        $scope.FormInfos=config.API_SERVER+'/v1/validate/'+validate.uid+'/'+validate.email
      });
      
    };


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
            $location.url('/account');
          },function(e){
            // still not connected
            $scope.FormErrors=('Wainting...');
            $timeout(tick, 2000);            
          });

      };
      $timeout(tick, 3000);

    };
    
    
  }  
]);


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

  function (config, $location, $rootScope, $route, $resource) {
    
    
    var defaultUser = {
      id: '',
      name: {
        givenName: '',
        familyName: '',
      },
      photo:config.user.photo,
      email: '',
      roles: [],
      provider: '',
      url: '',
    };
    
    //
    // default behavior on error
    var onerr=function(data,config){
      _user.copy(defaultUser);
    };
    
    var User = function(data) {
      angular.extend(this, defaultUser, data);
    }

    User.prototype.copy = function(data) {
        angular.extend(this, data);
    };


    User.prototype.display=function(){
        if (this.displayName)return this.displayName;
        if (this.name && (this.name.givenName || this.name.familyName)) {
          return this.name.givenName+' '+this.name.familyName
        }
        if (this.id){
          return this.id+'@'+this.provider;
        }
          
        return 'Anonymous';
    }
    
    User.prototype.isOwner=function(shopname){
        if (this.isAdmin())return true;
        for (var i in this.shops) {
          if (this.shops[i].name === shopname) {
            return true;
          }
        }
        return false;
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
        if(cb)cb(_user);
      },err);
      return u;
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

