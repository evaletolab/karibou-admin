;(function(angular) {'use strict';

//
// Define the Order module (app.shop)  for controllers, services and models
// the app.shop module depend on app.config and take resources in shop/*.html
angular.module('app.order.shopper', ['app.order.ui','app.config', 'app.api'])
  .controller('OrderShopperCtrl',OrderShopperCtrl)

OrderShopperCtrl.$inject=['$scope', '$routeParams','$log', '$controller', 'order']
function OrderShopperCtrl($scope,$routeParams, $log, $controller, order) {
  $controller('OrderCommonCtrl', {$scope: $scope}); 



  //
  // get all orders by default for the current month
  $scope.findAllOrdersForShipping=function(){

    var filters=$scope.filters=$routeParams, today=new Date();
    if(!filters.fulfillments)filters.fulfillments='fulfilled'
    if(!filters.month)filters.month=today.getMonth()+1;
    if(filters.fulfillments==='fulfilled')filters.closed=true;
    $scope.loading=true;

    order.findAllOrders(filters).$promise.then(function(orders){
      $scope.orders=orders;
      $scope.addresses=orders.map(function(order){return order.shipping})
      $scope.dates=orders.map(function (order) {
        return ((order.shipping.when))
      }).filter(function(v,i,self) {
        return self.indexOf(v)===i;
      })

      // select default date
      if($scope.dates.length){
        filters.f=$scope.dates[0]
      }

      $scope.loading=false;

    })
  }

}


})(window.angular);
