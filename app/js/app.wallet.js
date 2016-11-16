;(function(angular) {'use strict';

//
// Define the Document module (app.document)  for controllers, services and models
// the app.document module depend on app.config and take resources in document/*.html 
angular.module('app.wallet', ['app.config', 'app.api','app.ui'])
  .config(walletConfig)
  .controller('WalletCtrl',walletCtrl)
  .factory('wallet',walletFactory);


//
// define all routes for user api
walletConfig.$inject=['$routeProvider','$locationProvider','$httpProvider'];
function walletConfig($routeProvider, $locationProvider, $httpProvider){

  // List of routes of the application
  $routeProvider
    .when('/admin/wallets', {
        title:'Les Wallets ',  templateUrl : '/partials/dashboard/dashboard-wallet.html'
    })
    .when('/wallet/create', {
        title:'Acheter une carte cadeau ',  templateUrl : '/partials/account/wallet-create.html'
    })
    .when('/wallet/giftcards/:alias', {
        controller:'WalletCtrl', templateUrl : '/partials/document/document.html'
     });
}

//
// implement controller
walletCtrl.$inject=[
  '$scope','$rootScope','$routeParams','$location','config','feedback','$http'
];

function walletCtrl ($scope,$rootScope, $routeParams, $location, config, feedback, $http) {
  //
  // init context
  $scope.defaultLabel={
  };

  $scope.defaultTitle={
  };



  //
  // init an empty list
  $scope.gift=false;
  $scope.wallets=[];
  $scope.modal = {};

  config.shop.then(function () {
  });

  var api=$scope.api, user=$scope.user;

  $scope.modalWalletDetails=function (wallet) {
    var expiry=new Date(wallet.card.expiry);
    $scope.modal = wallet;
    $scope.modal.bank ={};
    $scope.modal.card.expiry=(expiry.getMonth()+1)+'/'+expiry.getFullYear();

    //
    //
    $scope.modal.name=$scope.modal.card.name;
    $scope.modal.expiry=$scope.modal.card.expiry;
    angular.extend($scope.modal.bank,$scope.modal.external_account||{});
  };

  $scope.modalDissmiss=function(){
    var modal=$scope.modal;
    $scope.modal = {};
  };

  $scope.dirtyWallet=function () {
    return !(($scope.modal.name!==$scope.modal.card.name) || ($scope.modal.expiry!==$scope.modal.card.expiry));
  };

  $scope.updateWallet=function (wid,password) {
    $rootScope.WaitText="Waiting ...";    

    //
    // update name
    if($scope.modal.name!==$scope.modal.card.name){
      $http.post(config.API_SERVER+'/v1/wallets/'+encodeURIComponent(wid),
        {name:$scope.modal.name,password:password}).then(function (result) {
        api.info($scope,"Name saved ...");
      });
    }

    //
    // update expriry (ADMIN ONLY)
    if($scope.modal.expiry!==$scope.modal.card.expiry){
      $http.post(config.API_SERVER+'/v1/wallets/expiry/'+encodeURIComponent(wid),
        {expiry:$scope.modal.expiry,password:password}).then(function (result) {
        api.info($scope,"Expiry saved ...");
      });
    }

  };

  $scope.updateBANK=function (wid,bank,password) {
    $rootScope.WaitText="Waiting ..."; 

    $http.post(config.API_SERVER+'/v1/wallets/'+encodeURIComponent(wid),{external_account:bank,password:password}).then(function (result) {
      api.info($scope,"BANC saved ...");
    });
  };

  $scope.creditWallet=function (wid,bank,amount,description,refid,credit,password) {
    $rootScope.WaitText="Waiting ...";    
    var transfer={
      amount:amount,
      description:description,
      bank:bank,
      refid:refid,
      type:credit,
      password:password
    };
    $http.post(config.API_SERVER+'/v1/wallets/credit/'+encodeURIComponent(wid),transfer).then(function (result) {
      api.info($scope,"CREDIT saved ...");
      $scope.modalWalletDetails(result.data);
    });
  };


  
  
  $scope.create=function(){
    $rootScope.WaitText="Waiting ...";    
  };

  $scope.remove=function(wallet,password){    
    $rootScope.WaitText="Waiting ...";    
  };

  
  //
  // load docs from user.id, or/and category
  $scope.findGiftWallets=function (options) {
    $rootScope.WaitText="Waiting ...";    
    options=options||_.extend({},$routeParams);
    $http({url:config.API_SERVER+'/v1/wallets/giftcard',method:"GET",params:options||{}}).then(function (result) {
      $scope.wallets=result.data;
      $scope.gift=true;
    });
  };
 
  
  //
  // load docs from user.id, or/and category
  $scope.findOtherWallets=function (options) {
    $rootScope.WaitText="Waiting ...";    
    options=options||_.extend({},$routeParams);
    $http({url:config.API_SERVER+'/v1/wallets',method:"GET",params:options||{}}).then(function (result) {
      $scope.wallets=result.data;
      $scope.gift=false;
    });
  };


  $scope.registerGiftcode=function (card) {
    $rootScope.WaitText="Waiting ...";    
    var wallet=_.find(user.payments,function (p) {return p.issuer==='wallet';});
    if(!wallet.alias){
      return api.info($scope,"Vous n'avez pas de compte commercial! ");
    }

    $http.post(config.API_SERVER+'/v1/wallets/register/'+wallet.alias,{number:card,name:user.display()}).then(function (result) {
      $scope.giftcode={};
      api.info($scope,"Votre carte cadeau a été chargé dans votre compte, merci!",function () {
        $scope.wallet=result.data;
        $location.url('/account/wallet');
      });
    });
  };

  $scope.createGiftcode=function (wallet) {
    $rootScope.WaitText="Waiting ...";    
    $http.post(config.API_SERVER+'/v1/wallets',wallet).then(function (result) {
      $scope.wallet=result.data;
      $scope.giftcode={};        
      $scope.giftcode.amount=100;
      $scope.giftcode.payment = user.payments[0].alias;
      api.info($scope,"Votre carte cadeau a été créée et envoyée, merci!",function () {
        $location.url('/account/overview');
      });
    });
  };

  $scope.loadMyWallet=function () {
    user.$promise.then(function (argument) {
      var wallet=_.find(user.payments,function (p) {
        return p.issuer==='wallet';
      });
      $http.get(config.API_SERVER+'/v1/wallets/'+wallet.alias).then(function (result) {
        $scope.wallet=result.data;
        $scope.giftcode={};
        $scope.giftcode.amount=100;
        $scope.giftcode.payment = _.find(user.payments,function (payment) {
          return(['visa','mastercard','american express'].indexOf(payment.issuer)!==-1);
        });
      });
    });
  };   

  $scope.loadMyGiftcards=function () {
    $http.get(config.API_SERVER+'/v1/wallets/giftcard?id='+user.id).then(function (result) {
      $scope.giftcards=result.data;
    });
  };

}




/**
 * app.document provides a model for interacting with Wallet.
 * This service serves as a convenient wrapper for other related services.
 */
walletFactory.$inject=['config','$resource','$q','$rootScope','api','user'];
function walletFactory (config, $resource, $q,$rootScope, api,user) {


  var defaultWallet = {
  };

  //
  // fetch user info trigger  
  $rootScope.$on("user.init",function(){
  });      


  
  //
  // this is the restfull backend for angular 
  // - /v1/documents/skus/:skus
  // - /v1/documents/category/:category
  // - /v1/documents/:slug
  // - /v1/documents'
  var backend={  
    documents:$resource(config.API_SERVER+'/v1/documents/:slug/:param',
      {slug:'@slug'}, {
      findBySkus:{method:'GET',isArray:true,params:{slug:'skus'}},
      findByCategory:{method:'GET',isArray:true,params:{slug:'category'}},
      get:{method:'GET',isArray:false},
      update: {method:'POST'},
      delete: {method:'PUT'},
    })
  };

  var Wallet = function(data) {
    this.model={};
    this.models=[];
    angular.extend(this.model, Wallet, data);

    //
    // wrap promise to this object
    this.$promise=$q.when(this);

  };



  Wallet.prototype.get = function(wid) {
    this.model=backend.documents.get({slug:slug});
    return this;
  };


  Wallet.prototype.save=function(wid){
    this.model=backend.documents.save(this.model);
    return this;
  };    

  Wallet.prototype.create=function(){
    this.model=backend.documents.save(this.model);
    return this;
  };    
  
  Wallet.prototype.remove=function(password,cb,err){
    this.model=this.model.$delete({password:password});
    return this;
  };    
 
  _wallets=new Wallet();  
  return _wallets;
}



})(window.angular);
