;(function(angular) {'use strict';

//
// Define the Order module (app.shop)  for controllers, services and models
// the app.shop module depend on app.config and take resources in shop/*.html
angular.module('app.order.common', ['app.order.ui','app.config', 'app.api'])
  .controller('OrderCommonCtrl',OrderCommonCtrl);

OrderCommonCtrl.$inject=['$scope','$routeParams','api','order','user','product','shop','Map','config'];
function OrderCommonCtrl($scope, $routeParams, api, order, user, product,shop, Map, config) {

  $scope.map=new Map();
  $scope.user=user;
  $scope.config=config;
  $scope.order=order;
  $scope.errors=false;
  $scope.products=[];
  $scope.filters={};
  $scope.shops=false;
  $scope.months=[1,2,3,4,5,6,7,8,9,10,11,12];
  $scope.months_short="janv._févr._mars_avr._mai_juin_juil._août_sept._oct._nov._déc.".split("_");
  $scope.months_long="janvier_février_mars_avril_mai_juin_juillet_août_septembre_octobre_novembre_décembre".split("_");

  $scope.years=[2014,2015];
  $scope.loading=true;

  $scope.options={
    showMenu:false
  };

  $scope.shopsSelect=shop.query({});

  // default model for modal view
  $scope.modal = {};

  $scope.sortByDateDESC= function (date1, date2) {
    //var date1=new Date(o1.shipping.when);
    //var date2=new Date(o2.shipping.when);
    if (date1 > date2) return -1;
    if (date1 < date2) return 1;
    return 0;
  };

  config.shop.then(function(){
    var currentDay=order.findCurrentShippingDay();

    //
    // based on url we have to change those values
    $scope.shipping={
      timeLeftNextDay:Math.round((order.findNextShippingDay().getTime()-Date.now())/3600000),
      timeLeftCurrentDay:Math.round((currentDay.getTime()-Date.now())/3600000),
      nextDay:order.findNextShippingDay(),
      currentDay:order.findCurrentShippingDay()
    };

    if($routeParams.when){
      $scope.shipping.currentDay=new Date($routeParams.when);
    }
  });


  $scope.modalShopDetails=function (shop) {
    $scope.shopsSelect.forEach(function (s) {
      if(s.urlpath===shop){
        $scope.modal=s;
      }
    })
  }


  $scope.modalUserDetails=function(oid){
    for(var i in $scope.orders){
      if($scope.orders[i].oid==oid){
        $scope.modal=$scope.orders[i];
        return;
      }
    }
  };

  //
  //
  $scope.modalDissmiss=function(){
    $scope.modal = {};
  };


  //
  //
  $scope.isSelectedDate=function (day) {
    if(!$scope.filters.f) return false;
    return ($scope.filters.f===day);
  };


  //
  // FIXME replace this by orderBy: use this to group order view by shipping date
  $scope.currentShippingDate=new Date('1970');
  $scope.groupByShippingDate = function(date, idx) {
    var d=new Date(date);d.setHours(12,0,0,0);
    var showHeader = (d.getTime()!==$scope.currentShippingDate.getTime());
    $scope.currentShippingDate = d;
    return showHeader||(idx===0);
  };

  //
  // use this to group order view by Customer
  $scope.currentCustomer='pok1';
  $scope.groupByCustomer = function(customer, idx) {
    var showHeader = (customer!==$scope.currentCustomer);
    $scope.currentCustomer = customer;
    return showHeader||(idx===0);
  };
  //
  //
  $scope.getOrderStatusClass=function(order,prefix){
    // order.fulfillments.status
    // "failure","created","partial","fulfilled"

    // order.payment.status
    // "pending","authorized","partially_paid","paid","partially_refunded","refunded","voided"
    prefix=prefix||'';
    if(order.fulfillments.status=='failure')
      return prefix+'danger';

    if(order.fulfillments.status=='partial')
      return prefix+'warning';

    if(order.fulfillments.status=='fulfilled')
      return prefix+'success';

    return '';
  };


  $scope.getOrderItemStatusClass=function(item,prefix){
    prefix=prefix||'';
    var orderFailure=(item.fulfillments&&item.fulfillments.status==='failure');
    var itemStatus=item.fulfillment.status;
    //
    // PAD widget 
    if(item.selected){
      prefix='list-group-item-selected '+prefix;
    }

    if(item.fulfillment.status=='failure' ||orderFailure)
      return prefix+'danger';

    if(item.fulfillment.status=='partial')
      return prefix+'warning';

    if(item.fulfillment.status=='fulfilled')
      return prefix+'success';

    return prefix;
  };

  $scope.isItemValidated=function (item) {
    var orderFailure=(item.fulfillments&&item.fulfillments.status==='failure');
    var itemStatus=item.fulfillment.status;
    return !(item.fulfillment.status=='failure' ||orderFailure);

  };


  $scope.countItemValidated=function (items, when) {
    var count=0;
    for (var i = (items||[]).length - 1; i >= 0; i--) {
      if(when&&items[i].when!==when) continue;
      if(['failure','fulfilled'].indexOf(items[i].fulfillment.status)!==-1){
        count++;
      }
    };
    return count;
  };

  $scope.countItemAvailable=function (items, when) {
    var count=0;
    for (var i = (items||[]).length - 1; i >= 0; i--) {
      if(when&&items[i].when!==when) continue;
      count++;
    };
    return count;
  };


  //
  // 
  $scope.getOrderPhones=function(order){
    return order.customer.phoneNumbers.map(function(p){
      return p.number;
    }).join(';');
  };



  //
  // cancel and close the order
  $scope.orderCancel=function(order,reason){
    order.cancelWithReason(reason).$promise.then(function(o){
      api.info($scope,"Commande annulée",2000);
      // FIXME order status on cancel should be set from http result
      order.fulfillments.status='failure';
      order.payment.status="voided";
      order.cancel={};
      order.cancel.reason=reason;
    });
  };

  //
  // send order invoice
  $scope.orderInvoice=function(order){
      api.info($scope,"Functionalité en cours de développement",2000);
  };


  //
  // get all orders for a customer
  $scope.findOrdersByUser=function(){
    $scope.loading=true;
    user.$promise.then(function(){
      order.findOrdersByUser(user).$promise.then(function(orders){
        $scope.orders=orders;
        $scope.shops=false;
        $scope.loading=false;
      });

    });
  };


  //
  // selected item? 
  $scope.selectedItem={};
  $scope.selectItem=function (item,shop) {
    var items=$scope.shops[shop];
    for (var i = items.length - 1; i >= 0; i--) {
      if(items[i].selected){
        items[i].selected=false;
        break;
      }
    }
    item.selected=true;
    $scope.selectedItem=item;
  };


}


})(window.angular);
