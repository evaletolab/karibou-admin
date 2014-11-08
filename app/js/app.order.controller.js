;(function(angular) {'use strict';

//
// Define the Order module (app.shop)  for controllers, services and models
// the app.shop module depend on app.config and take resources in shop/*.html
angular.module('app.order.admin', ['app.order.ui','app.config', 'app.api'])

.controller('OrderAdminCtrl',[
  '$scope', '$routeParams','$controller','api','order','user','product','Map','config','$log',
  function ($scope,$routeParams, $controller, api, order, user, product, Map, config, $log) {

    // inherit from OrderCtrl
    // $controller('OrderCtrl', {$scope: $scope}); 
    var cb_error=api.error($scope);

    $scope.map=new Map()
    $scope.config=config;
    $scope.order=order;
    $scope.errors=false;
    $scope.orders=[];
    $scope.products=[];
    $scope.filters={}
    $scope.shops=false;

    // default model for modal view
    $scope.modal = {};

    config.shop.then(function(){
      $scope.shippingDays=order.findOneWeekOfShippingDay(true);
    })



    //
    // current shipping date based on the url
    $scope.currentShipping=function(){
      var date=($routeParams.when=='next')?order.findCurrentShippingDay():Date.parse($routeParams.when);
      if(date){
        return moment(date).format('dddd DD MMM YYYY', 'fr')
      }
    }

    $scope.filterDateByDay=function(dates){
      for (var i = dates.length - 1; i >= 0; i--) {
        //dates[i].when
      };

    }

    $scope.modalUserDetails=function(oid){
      for(var i in $scope.orders){
        if($scope.orders[i].oid==oid){
          $scope.modal=$scope.orders[i]
          return
        }
      }
    }

    $scope.modalDissmiss=function(){
      $scope.modal = {};
    }


    $scope.groupByShops=function(orders){
      var shops={}
      orders.forEach(function(order){
        order.items.forEach(function(item){

          // init item for this shop
          if(!shops[item.vendor]){
            shops[item.vendor]=[]
          }
          // add item to this shop
          item.rank=order.rank
          item.oid=order.oid
          item.email=order.email
          item.customer=order.customer
          item.created=order.created
          item.fulfillments=order.fulfillments
          shops[item.vendor].push(item)
        })
      })
      return shops
    }

    $scope.getOrderStatusClass=function(order){
      // order.fulfillments.status
      // "failure","created","partial","fulfilled"

      // order.payment.status
      // "pending","authorized","partially_paid","paid","partially_refunded","refunded","voided"
      if(order.fulfillments.status=='failure')
        return 'danger'

      if(order.fulfillments.status=='partial')
        return 'warning'

      if(order.fulfillments.status=='fulfilled')
        return 'success'

      return ''
    }


    $scope.getOrderItemStatusClass=function(item){
      var orderFailure=(item.fulfillments&&item.fulfillments.status==='failure');
      var itemStatus=item.fulfillment.status
      if(item.fulfillment.status=='failure' ||orderFailure)
        return 'danger'

      if(item.fulfillment.status=='partial')
        return 'warning'

      if(item.fulfillment.status=='fulfilled')
        return 'success'
    }

    $scope.getInputDisabled=function(item){
      var orderDisabled=(item.fulfillments&&item.fulfillments.status==='failure');
      var itemDisabled=(['failure','fulfilled'].indexOf(item.fulfillment.status)!==-1)
      return itemDisabled||orderDisabled;
    }

    //
    // display pay button when order is fulfilled
    $scope.showPayButton=function(order){
      if(!user.isAdmin()) return false;
      return (['voided','payed'].indexOf(order.payment.status)===-1) && (order.fulfillments.status==='fulfilled')
    }


    //
    // pay and close the order
    $scope.pay=function(order){
      order.payment().$promise.then(function(){
        
      })
    }


    //
    // use this to group order view by shipping date
    $scope.currentShippingDate=new Date('1970');
    $scope.groupByShippingDate = function(date, idx) {
      var d=new Date(date);d.setHours(12,0,0,0)
      var showHeader = (d.getTime()!==$scope.currentShippingDate.getTime());
      $scope.currentShippingDate = d;
      return showHeader||(idx===0);
    }


    //
    // get all orders
    $scope.findAllOrders=function(){

      var params=$routeParams;

      //
      // is admin?
      if(!user.isAdmin()){
        params.action='shops'
      }

      order.findAllOrders(params).$promise.then(function(orders){
        $scope.orders=orders;
        $scope.shops=false;
        //
        // group by shop?
        if($routeParams.groupby==='shop'){
          $scope.shops=$scope.groupByShops(orders)
        }
      })
    }

    $scope.loadAllProducts=function(){
      user.$promise.then(function(){
        var params={sort:'categories.weight'};
        // filter with the user shop
        if(!user.isAdmin()){
          params.shopname=user.shops[0].urlpath
        }

        $scope.products=product.query(params,function(products){
          $scope.products=products;
        });

      });
    }


    $scope.updateItem=function(oid,item,fulfillment){
      for (var o in $scope.orders){
        if($scope.orders[o].oid===oid){
          return $scope.orders[o].updateItem(item,fulfillment,function(){
            api.info($scope,"Status enregistré",2000);
          },cb_error)
        }
      }
    }


    // 
    // default : findAllOrders
    $scope.initContext=function(){
      // when
      if($routeParams.view==='stock'){
        $scope.loadAllProducts();
      }else if($routeParams.view==='all'){
        $scope.findAllOrders();
      }else{
        $scope.findAllOrders();
      }
    }

    $scope.initContext()
  }
]);

})(window.angular);
