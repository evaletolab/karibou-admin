;(function(angular) {'use strict';

/**
 * Angular.js module for feedback
 */
angular.module('app.feedback',['app.config','app.user'])
  .controller('FeedbackCtrl',FeedbackCtrl)
  .factory('feedback',feedbackFactory);


//
// Define the application level controllers
FeedbackCtrl.$inject=['config','$scope','$rootScope','$timeout','$http','$location','user','api'];
function FeedbackCtrl(config, $scope, $rootScope,$timeout, $http, $location, user,api) {
  function loadRouteScope(feedback,route) {
    feedback.shop=feedback.product=false;
    //
    // handle on the path scope
    if(route.scope){
      if(route.scope.product&&route.scope.product.sku){
        feedback.product=route.scope.product;
      }
      else if(route.scope.$$childHead&&route.scope.$$childHead.shop){
        feedback.shop=route.scope.$$childHead.shop;
      }
    }
  }
  $scope.config=config;
  $scope.user=user;
  var feedback=$rootScope.feedback={
    product:false,
    shop:false,
    show:false,
    email:'',
    mood:'J\'ai une question a propos de Karibou' ,
    moods:[
      'Le site de fonctionne pas',
      'Je ne trouve pas comment faire',
      'J\'ai une question a propos de Karibou',
      'J\'aimerai un nouveau produit',
      'J\'aimerai un lieu pour la collecte de ma commande',
      'Le marché est génial'
    ]    
  };

  user.$promise.finally(function () {
    if(user.email){feedback.email=user.email.address;}
  });

  $scope.disableFeedbackWidget=function () {
      var currentPath=$location.path();

      //
      // if referer is in protected path?
      if(_.find(config.avoidFeedbackIn,function(path){
          return (currentPath.indexOf(path)!==-1);})){
        return false;
      }

    return true;
  };

  //
  // be sure to update user value when it change is state from anonymous to logged
  $scope.disableFeedbackButton=function () {
    if(user.email&&user.email.address&&!feedback.email){
      feedback.email=user.email.address;
    }

    return (!feedback.comment||!feedback.email);
  };

  $scope.getTitle=function () {
    if(feedback.product) {return 'Contactez: '+feedback.product.vendor.name;}
    if(feedback.shop){return 'Contactez: '+feedback.shop.name;}
    return 'Contactez l\'équipe Karibou?';
  };

  $scope.contextSite=function () {
    return !feedback.shop&&!(feedback.product&&feedback.product.sku);
  };

  $scope.contextProduct=function () {
    return feedback.product&&feedback.product.sku;
  };

  $scope.contextShop=function () {
    return feedback.shop;
  };

  $scope.fbCancel=function () {
    feedback.show=false;
  };

  $scope.sendComment=function () {
    var content={};
    content.text=feedback.comment;
    content.mood=feedback.mood;
    if(feedback.shop&&feedback.shop.urlpath)
      {content.shopname=feedback.shop.urlpath;}
    if(feedback.email)
      {content.email=feedback.email;}
    if(feedback.product&&feedback.product.sku)
      {content.product=feedback.product.title+' ('+feedback.product.sku+')';}

    $http.post(config.API_SERVER+'/v1/comment', content).
      success(function(data, status, headers, config) {
        feedback.show=false;
        feedback.comment=undefined;
        api.info($scope,"Votre question à bien été envoyé! Vous serez contacté dans les plus brefs délais");        
      });
    
  };

  $scope.$on('$routeChangeSuccess', function (event, route) {
    // console.log('DEBUG-FB------------->',route.current)
    $timeout(function () {
      loadRouteScope(feedback,route);
    },1000);
  });

  // loadRouteScope(feedback,$route.current)
}
  

 
//
// define dependency injection and implement servie
feedbackFactory.$inject=['config','user','$rootScope','$resource'];
function feedbackFactory(config, user, $rootScope,$resource) {


  var Feedback = function(data) {
  };


  Feedback.prototype.clear=function(){
  };

  return new Feedback();
}



})(window.angular);
