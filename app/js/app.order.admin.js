'use strict';

//
// Define the Order module (app.shop)  for controllers, services and models
// the app.shop module depend on app.config and take resources in shop/*.html 
angular.module('app.order.admin', ['app.order.ui','app.config', 'app.api'])

.controller('OrderAdminCtrl',[
  'config',
  '$scope',
  '$location',
  '$rootScope',
  '$routeParams',
  '$timeout',
  'api',
  'order',
  'cart',
  'user',
  'shop',
  'product',
  'Map',
  '$log',

  function (config, $scope, $location, $rootScope,$routeParams, 
           $timeout,  api, order, cart, user, shop, product, Map, $log) {
    var cb_error=api.error($scope);

    $scope.map=new Map()
    $scope.config=config;
    $scope.order=order;
    $scope.cart=cart;
    $scope.errors=false;
    $scope.orders=[];
    $scope.products=[];
    $scope.filters={}
    $scope.shops=false;

    // default model for modal view
    $scope.modal = {};      


    // remove displayed cart
    $('html').removeClass('display-cart')

    //
    // init order fields
    user.$promise.then(function(){
      var p=user.hasPrimaryAddress();
      $scope.cart.config.address=(p!=-1)?p:0;      
    })

    config.shop.then(function(){
      $scope.shippingDays=order.findOneWeekOfShippingDay();
      if($scope.shipping)
        return
      $scope.shipping=order.findCurrentShippingDay();
    })
 
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

    $scope.getActiveClass=function(key,value){
      // no option
      if(key==undefined){
        return (Object.keys($routeParams).length===0)?'active':''
      }

      // options
      return ($routeParams[key]==value)?'active':''
    }

    //
    // use this to group order view by shipping date
    $scope.currentShippingDate=new Date('1970');
    $scope.groupByShippingDate = function(date) {
      var d=new Date(date);d.setHours(12,0,0,0)
      var showHeader = (d.getTime()!==$scope.currentShippingDate.getTime());
      $scope.currentShippingDate = d;
      return showHeader;
    }    



    //
    // get order by user
    $scope.findOrdersByShop=function(){
      $scope.shops=false
      user.$promise.then(function(){
        order.findOrdersByShop(user.shops[0],$routeParams).$promise.then(function(orders){
          $scope.orders=orders;
          if($routeParams.groupby==='shop'){
            $scope.shops=true
          }
        });
      });
    }

    //
    // get order by user
    $scope.findOrdersByUser=function(){
      user.$promise.then(function(){
        order.findOrdersByUser(user).$promise.then(function(orders){
          $scope.orders=orders;
        });

      })
    }

    //
    // get all orders
    $scope.findAllAdminOrders=function(){

      order.findAllOrders($routeParams).$promise.then(function(orders){
        $scope.orders=orders;
        $scope.shops=false;
        //
        // group by shop?
        if($routeParams.groupby==='shop'){
          $scope.shops=$scope.groupByShops(orders)
          $scope.title+=' par boutiques'
        }
      })
    }

    $scope.loadAllProducts=function(){
      $scope.products=product.query({sort:'categories.weight'},function(products){
        $scope.products=products;
      });
    }

    $scope.loadShopProducts=function(){
      $scope.products=product.query({sort:'categories.weight',shopname:user.shops[0].urlpath},function(products){
        $scope.products=products;
      });
    }
  }  
]);
