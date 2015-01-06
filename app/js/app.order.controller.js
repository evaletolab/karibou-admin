;(function(angular) {'use strict';

//
// Define the Order module (app.shop)  for controllers, services and models
// the app.shop module depend on app.config and take resources in shop/*.html
angular.module('app.order.admin', ['app.order.ui','app.config', 'app.api'])

.controller('OrderAdminCtrl',[
  '$scope', '$routeParams','$location','api','order','user','product','Map','config','$log',
  function ($scope,$routeParams, $location, api, order, user, product, Map, config, $log) {

    // inherit from OrderCtrl
    // $controller('OrderCtrl', {$scope: $scope}); 
    var cb_error=api.error($scope);

    $scope.map=new Map()
    $scope.user=user;
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
      var currentDay=order.findCurrentShippingDay();
      //
      // based on url we have to change those values
      $scope.shipping={
        days:order.findOneWeekOfShippingDay(true),
        timeLeftNextDay:Math.round((order.findNextShippingDay().getTime()-Date.now())/3600000),
        timeLeftCurrentDay:Math.round((currentDay.getTime()-Date.now())/3600000),
        nextDay:order.findNextShippingDay(),
        currentDay:currentDay,
        pastDays:order.findPastWeekOfShippingDay(currentDay),
        isToday:function(date){
          return (new Date(date).getDay())===(new Date().getDay())
        }
      }
      // if date is specified
      if(!isNaN(Date.parse($routeParams.when)))
        $scope.shipping.currentDay=Date.parse($routeParams.when)
    })


    $scope.countShops=function(shops){
      if(!shops)return;
      return Object.keys(shops).length
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
      var itemDisabled=(['fulfilled'].indexOf(item.fulfillment.status)!==-1)
      return itemDisabled||orderDisabled;
    }

    //
    // display pay button when order is fulfilled
    $scope.showCaptureButton=function(order){
      if(!user.isAdmin()) return false;
      return (['voided','paid'].indexOf(order.payment.status)===-1) && (order.fulfillments.status==='fulfilled')
    }


    //
    // capture and close the order
    $scope.orderCapture=function(order){
      order.capture().$promise.then(function(o){
        api.info($scope,"Commande capturée",2000);
        for (var i = $scope.orders.length - 1; i >= 0; i--) {
          if($scope.orders[i].oid===order.oid){$scope.orders[i]=o}
        };

      },cb_error)
    }

    //
    // cancel and close the order
    $scope.orderCancel=function(order,reason){
      order.cancelWithReason(reason).$promise.then(function(o){
        api.info($scope,"Commande annulée",2000);
        // FIXME order status on cancel should be set from http result
        order.fulfillments.status='failure';
        order.payment.status="voided";
        order.cancel={}
        order.cancel.reason=reason;
      },cb_error)
    }

    //
    // cancel and close the order
    $scope.orderDelete=function(order){
      order.remove().$promise.then(function(){
        api.info($scope,"Commande suprimmée",2000);
        for (var i = $scope.orders.length - 1; i >= 0; i--) {
          if($scope.orders[i].oid===order.oid){$scope.orders.splice(i,1)}
        };
      },cb_error)
    }


    $scope.informShopToOrders=function(shop,content){
      order.informShopToOrders(shop,content, function(){
          api.info($scope,"Votre message à bien été envoyé! ");        
      },cb_error);
    }
    


    $scope.updateItem=function(oid,item,fulfillment){
      for (var o in $scope.orders){
        if($scope.orders[o].oid===oid){
          return $scope.orders[o].updateItem(item,fulfillment).$promise.then(function(){
            api.info($scope,"Status enregistré",2000);
          },cb_error)
        }
      }
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
    // get all orders for a customer
    $scope.findOrdersByUser=function(){
      user.$promise.then(function(){
        order.findOrdersByUser(user).$promise.then(function(orders){
          $scope.orders=orders;
          $scope.shops=false;
        },cb_error)

      })
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

      //
      // is logistic?
      if($scope.displayLogisitic){
        //params.fulfillments=(params.fulfillments||'fulfilled')
        params.when=(params.when||'current')
        if(params.fulfillments==='fulfilled')params.closed=true;
      }


      order.findAllOrders(params).$promise.then(function(orders){
        $scope.orders=orders;
        $scope.shops=false;
        $scope.addresses=orders.map(function(order){return order.shipping})
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



    // 
    // default : findAllOrders
    // TODO this is so hugly, please change that!!!
    $scope.initContext=function(){
      $scope.displayLogisitic=($location.path().indexOf('/admin/shipping')!==-1)
      // trap orders for a customer
      if($location.path().indexOf('/account/orders')!==-1){
        $scope.findOrdersByUser();
      }else if($routeParams.view==='stock'){
        $scope.loadAllProducts();
      }else{
        // else vendor needs his orders
        $scope.findAllOrders();
      }
    }

    //
    // load scope for each creation
    $scope.initContext()
  }
]);

})(window.angular);
