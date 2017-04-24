;(function(angular) {'use strict';

//
// Define the Order module (app.shop)  for controllers, services and models
// the app.shop module depend on app.config and take resources in shop/*.html
angular.module('app.order.repport', ['app.order.ui','app.config', 'app.api'])
  .controller('OrderRepportCtrl',OrderRepportCtrl);

OrderRepportCtrl.$inject=['$scope','$rootScope', '$routeParams','$location','api','order','user','product','shop','$log', '$controller'];
function OrderRepportCtrl($scope,$rootScope,$routeParams, $location, api, order, user, product,shop, $log, $controller) {
  $controller('OrderCommonCtrl', {$scope: $scope}); 

  $scope.today=new Date();
  $scope.shopsSelect=[];


  $scope.multipleShops=function (repport) {
    if(!repport||!repport.shops)return 0;
    return Object.keys(repport.shops).length;
  };

  $scope.shopName=function (repport) {
    repport=repport||$scope.repport;
    if(!repport||!repport.shops){return '';}
    var strName=Object.keys(repport.shops).map(function(name){return repport.shops[name].name;}).join(', ');
    $rootScope.title='Activity report for - '+strName;
    return strName;
  };

  $scope.firstShop=function (repport) {
    repport=repport||$scope.repport;
    if(!repport||!repport.shops)return {};
    var available=Object.keys(repport.shops);
    return _.findWhere($rootScope.shops,{urlpath:available[0]});
  };



  $scope.getDetailledOrderUrl=function (order) {
    var params=($routeParams.closed)?'&closed='+$routeParams.closed:'';
    params+=($routeParams.fulfillments)?'&fulfillments='+$routeParams.fulfillments:'';
    return '/admin/shop/orders?groupby=shop&when='+order.shipping.when+params;
  };


  //
  // get all orders
  $scope.findAllShopRepport=function(){
    var filters=$scope.filters=$routeParams, today=new Date();
    $scope.loading=true;

    user.$promise.then(function(){

      order.findRepportForShop(filters).$promise.then(function(repport){
        $scope.loading=true;
        $scope.repport=repport;
        $scope.repportShops=Object.keys(repport.shops||[]);
        if(repport.shops){
          var select=Object.keys(repport.shops).map(function(slug) {
            return {urlpath:slug,name:repport.shops[slug].name,address:repport.shops[slug].address};
          });
          if($scope.shopsSelect.length<select.length){
            $scope.shopsSelect=select;  
          }
        }
        //$scope.addresses=repport.map(function(order){return order.shipping})
        $scope.loading=false;
      });
    });
  };




}


})(window.angular);
