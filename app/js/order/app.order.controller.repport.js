;(function(angular) {'use strict';

//
// Define the Order module (app.shop)  for controllers, services and models
// the app.shop module depend on app.config and take resources in shop/*.html
angular.module('app.order.repport', ['app.order.ui','app.config', 'app.api'])
  .controller('OrderRepportCtrl',OrderRepportCtrl);

OrderRepportCtrl.$inject=['$scope', '$routeParams','$location','api','order','user','product','shop','$log', '$controller'];
function OrderRepportCtrl($scope,$routeParams, $location, api, order, user, product,shop, $log, $controller) {
  $controller('OrderCommonCtrl', {$scope: $scope}); 

  $scope.today=new Date();
  $scope.shopsSelect=shop.query({});

  $scope.getAmountTotal=function (shop) {
    var total=0;
    if(!$scope.shops)return total;
    $scope.shops[shop].forEach(function (item) {
      total+=item.finalprice;
    });
    return total;
  };

  $scope.shopName=function (repport) {
    repport=repport||$scope.repport;
    if(!repport)return '';
    return Object.keys(repport.shops).map(function(name){return repport.shops[name].details.name;}).join(', ');
  };

  $scope.firstShop=function (repport) {
    repport=repport||$scope.repport;
    if(!repport)return {};

    return repport.shops[Object.keys(repport.shops)[0]];
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
        //$scope.addresses=repport.map(function(order){return order.shipping})
        $scope.loading=false;
      });
    });
  };




}


})(window.angular);
