;(function(angular) {'use strict';

/**
 * Angular.js module for feedback
 */
angular.module('app.feedback',['app.config','app.user'])
  .controller('FeedbackCtrl',FeedbackCtrl)
  .factory('feedback',feedbackFactory);


//
// Define the application level controllers
FeedbackCtrl.$inject=['config','$scope','$rootScope','$timeout','$location','user','api','feedback'];
function FeedbackCtrl(config, $scope, $rootScope,$timeout,  $location, user,api,feedback) {

  var fb=$scope.feedback=feedback;
  var currentPath=$location.path();

  user.$promise.finally(function () {
    if(user.email.address){
      feedback.setUser(user.email.address);      
    }
  });

  $scope.showFeedbackWidget=function () {

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
    if(user.email.address){
      feedback.setUser(user.email.address)
    }

    return (!fb.comment||!fb.email);
  };

  $scope.getTitle=function () {
    if(fb.product) {return fb.product.vendor.name;}
    if(fb.shop){return fb.shop.name;}
    return 'Une question?';
  };

  $scope.contextSite=function () {
    return !fb.shop&&!(fb.product&&fb.product.sku);
  };

  $scope.contextProduct=function () {
    return fb.product&&fb.product.sku;
  };

  $scope.contextShop=function () {
    return fb.shop;
  };


  $scope.sendComment=function () {
    var content={};
    content.text=fb.comment;
    content.mood=fb.mood;
    if(fb.shop&&fb.shop.urlpath){
      content.shopname=fb.shop.urlpath;
    }
    if(fb.email){
      content.email=fb.email;
    }
    if(fb.product&&fb.product.sku){
      content.product=fb.product.title+' ('+fb.product.sku+')';
    }

    feedback.send(content).success(function(data, status, headers, config) {
      fb.show=false;
      fb.comment=undefined;
      api.info($scope,"Votre question à bien été envoyé! Vous serez contacté dans les plus brefs délais");        
    });    
  };

  // update feedback state 
  $rootScope.$on('$routeChangeSuccess', function (event, route) {
    $timeout(function () {
      currentPath=$location.path();


      feedback.updateScope(route);
    },500);
  });

}
  

 
//
// define dependency injection and implement servie
feedbackFactory.$inject=['config','user','$rootScope','$http'];
function feedbackFactory(config, user, $rootScope,$http) {


  var Feedback = function(data) {
    this.shop=false;
    this.product=false;
    this.email=false;
    this.show=false;
    this.mood="J'ai une question a propos de Karibou";
    this.COMMENT='Un nouveau commentaire à été publié';
    this.moods=[
      'Le site ne fonctionne pas',
      'Je ne trouve pas comment faire',
      'J\'ai une question a propos de Karibou.ch',
      'J\'aimerai un nouveau produit',
      'J\'aimerai un lieu pour la collecte de ma commande',
      'Le marché est génial'
    ];    
  };


  Feedback.prototype.updateScope=function(route) {
    this.shop=this.product=false;

    if(route&&route.urlpath){
      this.shop=route;
    }
    if(route&&route.sku){
      this.product=route;
    }
    if(route&&route.scope){
      //
      // case of product
      if(route.scope.product&&route.scope.product.sku){
        return this.product=route.scope.product;
      }
      //
      // case of shop
      if(route.scope.$$childHead&&route.scope.$$childHead.shop){
        return this.shop=route.scope.$$childHead.shop;
      }
    }
  }

  Feedback.prototype.setUser=function(email) {
    this.email=email;
  };

  Feedback.prototype.setProduct=function(product) {
    this.product=product;
  };

  //
  // send feedback 
  //  content:
  //    - shopname
  //    - product
  //    - email
  //    - text
  //    - mood
  Feedback.prototype.send=function(content){
    return $http.post(config.API_SERVER+'/v1/comment', content);
  };

  return new Feedback();
}



})(window.angular);
