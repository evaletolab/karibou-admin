;(function(angular) {'use strict';

//
// Define the Order module (app.shop)  for controllers, services and models
// the app.shop module depend on app.config and take resources in shop/*.html
angular.module('app.order.shopper', ['app.order.ui','app.config', 'app.api'])
  .controller('OrderShopperCtrl',OrderShopperCtrl);

OrderShopperCtrl.$inject=['$scope', '$routeParams','$log', '$controller', 'order'];
function OrderShopperCtrl($scope,$routeParams, $log, $controller, order) {
  $controller('OrderCommonCtrl', {$scope: $scope}); 


  $scope.updateBagsCount=function (order,value) {
    order.updateBagsCount(value).$promise.then(function () {
      order.shipping.bags=value;
    });
  }

  //
  // get all orders by default for the current month
  $scope.findAllOrdersForShipping=function(){

    var filters=$scope.filters=$routeParams, today=new Date();
    if(!filters.payment)filters.fulfillments='fulfilled,partial';
    if(!filters.month)filters.month=today.getMonth()+1;
    // if(filters.fulfillments==='fulfilled,partial')filters.closed=true;
    $scope.loading=true;

    order.findAllOrders(filters).$promise.then(function(orders){
      $scope.orders=orders;filters.f=null;
      $scope.addresses=orders.map(function(order){return order.shipping;});
      $scope.dates=orders.map(function (order) {
        return ((order.shipping.when));
      }).filter(function(v,i,self) {
        return self.indexOf(v)===i;
      });

      // select current shipping
      if($scope.shipping.currentDay){
        var today=new Date($scope.shipping.currentDay).toLocaleDateString();
        if($scope.dates && $scope.dates.length>0){
          if(today===new Date(Date.parse($scope.dates[1])).toLocaleDateString()){
            filters.f=$scope.dates[1]; 
          }
        }
      }

      // select default date
      if($scope.dates.length && !filters.f){
        filters.f=$scope.dates[0];
      }

      $scope.loading=false;

    });
  };

}


})(window.angular);
