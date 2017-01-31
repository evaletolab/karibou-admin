;(function(angular) {'use strict';

//
// Define the Order module (app.shop)  for controllers, services and models
// the app.shop module depend on app.config and take resources in shop/*.html
angular.module('app.order.common', ['app.config', 'app.api'])
  .controller('OrderCommonCtrl',OrderCommonCtrl);

OrderCommonCtrl.$inject=['$scope','$routeParams','api','order','user','product','shop','Map','config','$q'];
function OrderCommonCtrl($scope, $routeParams, api, order, user, product,shop, Map, config, $q) {

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

  $scope.years=[2014,2015,2016];
  $scope.loading=true;

  $scope.selected={
    order:false,
    items:[]
  };

  $scope.options=angular.extend($scope.options||{},{
    showMenu:false,
    showWidget:false,
    payment:{},
    fulfillments:{}
  });

  $scope.options.payment={
    "pending":"pending",
    "authorized":"authorized",
    "partially_paid":"partially_paid",
    "invoice":"facture à payer",
    "paid":"payée et livrée",
    "partially_refunded":"partially_refunded",
    "refunded":"refunded",
    "voided":"voided"
  };

  $scope.options.fulfillments={
    "failure":"failure",
    "created":"created",
    "reserved":"reservée",
    "partial":"partial",
    "fulfilled":"complétée"
  };

  // $scope.shopsSelect=shop.query({});

  // default model for modal view
  $scope.modal = {};

  $q.all([config.shop,user.$promise,$scope.shopsSelect.$promise]).then(function(){
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

    //
    // map available shops
    $scope.shopsSelectMap={};
    $scope.shopsSelect.forEach(function(shop){
      $scope.shopsSelectMap[shop.urlpath]=shop;
    })
  });

  $scope.sortByDateDESC= function (date1, date2) {
    //var date1=new Date(o1.shipping.when);
    //var date2=new Date(o2.shipping.when);
    if (date1 > date2) return -1;
    if (date1 < date2) return 1;
    return 0;
  };



  //
  //
  $scope.selectOrderByShop=function(shop){
    if(!shop){
      $scope.selected.items=false;
      $scope.selected.shop=false;        
      angular.element("body").removeClass('noscroll');
      return;
    }
    $scope.selected.items=$scope.shops[shop];
    $scope.selected.shop=shop;
    angular.element("body").addClass('noscroll');
  };


  //
  // select order 
  $scope.selectOrder=function (o) {
    if($scope.selected.order&&$scope.selected.order.oid===o.oid){
      $scope.selected={};
      angular.element("body").removeClass('noscroll');
      return ;
    }
    $scope.selected.items=o.items;
    $scope.selected.order=o;
    angular.element("body").addClass('noscroll');
    
  };


  $scope.filterOrderByShopAndShippingDay=function(orders, when, shop) {
    // list available order for this shop and shipping day
    return _.sortBy(orders,function(o) {
      return o.rank;
    }).filter(function(order) {
      // shop filter is optional
      var hasShop=true;
      if(shop){
        hasShop=order.vendors.map(function(v){return v.slug;}).indexOf(shop)!==-1;
      }
      return hasShop&&order.shipping.when===when ;
    });
  };



  $scope.modalShopDetails=function (shop) {
    $scope.shopsSelect.forEach(function (s) {
      if(s.urlpath===shop){
        $scope.modal=s;
      }
    });
  };


  $scope.modalUserDetails=function(oid){
    for(var i in $scope.orders){
      if($scope.orders[i].oid==oid){
        $scope.modal=$scope.orders[i];
        return true;
      }
    }
  };

  //
  //
  $scope.modalDissmiss=function(){
    $scope.modal = {};
  };

  //
  // when displaying orders, the select can be blocked
  $scope.isShopSelectionAvailable=function () {
    if($routeParams.s){
      return false;
    }
    if(!user.isAdmin()&&user.shops.length<2){
      return false;
    }
    return true;
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

  $scope.isLogisticVisible=function(order,when) {
    user.logistic.postalCode=user.logistic.postalCode;
    var isPostalCodeOk=(user.logistic.postalCode.indexOf(order.shipping.postalCode)>-1);
    var isDateOk=(!when||when===order.shipping.when);
    var isShopperOk=(user.isAdmin()||(order.payment.fees.shipping>0 && isPostalCodeOk));
    return isDateOk&&isShopperOk;
  }

  //
  //
  $scope.getOrderStatusClass=function(order,prefix){
    // order.fulfillments.status
    // "failure","created","partial","fulfilled"

    // order.payment.status
    // "pending","authorized","partially_paid","paid","partially_refunded","refunded","voided"
    prefix=prefix||'';

    //
    // SELECT ITEM
    var selected='';
    if($scope.selected.order&&$scope.selected.order.oid===order.oid){
      selected=prefix+'active ';
    }


    if(order.fulfillments.status=='failure')
      return selected+prefix+'danger';

    //
    // for this case it depends if you are admin or vendor
    if(order.fulfillments.status=='partial'){
      if(order.getProgress()===100){
        return selected+prefix+'success';
      }
      return selected+prefix+'warning';
    }

    if(order.fulfillments.status=='fulfilled')
      return selected+prefix+'success';

    return selected;
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
    }
    return count;
  };

  $scope.countItemAvailable=function (items, when) {
    var count=0;
    for (var i = (items||[]).length - 1; i >= 0; i--) {
      if(when&&items[i].when!==when) continue;
      count++;
    }
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
  // copy an order in the new bask
  $scope.copyOrder=function (order) {
    var skus=[];
    order.items.forEach(function (item) {
      var sku={};
      sku[item.sku]=item.quantity;
      skus.push(sku);
      
      // body...
    });
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
    return user.$promise.then(function(){
      return order.findOrdersByUser(user).$promise;
    }).then(function(orders){
      $scope.orders=orders;
      $scope.shops=false;
      $scope.loading=false;
    });
  };


  //
  // selected item? TODO this should be a directive
  $scope.selectedItem={};
  $scope.selectItem=function (item,shop, $event) {
    var items=$scope.shops[shop], options=$scope.options;
    if($event){
      $event.stopPropagation();
    }

    for (var i = items.length - 1; i >= 0; i--) {
      if(items[i].selected){
        items[i].selected=false;
        if(options.showWidget){

        }
        break;
      }
    }
    item.selected=true;
    $scope.selectedItem=item;
  };


  var promise;
  $scope.loadNextPage=function(opts){
    if($scope.scrollBusy) return;
    if(!promise){
     promise=$scope.findOrdersByUser();
     $scope.scrollBusy=true;
     $scope.infinite=[];
    } 


    // scroll
    promise.then(function(){     
      var position=$scope.infinite.length;
      $scope.scrollBusy=false;
      for (var i = 0; i<8; i++) {
        if(($scope.infinite.length)>=$scope.orders.length){
          return;
        }
        $scope.infinite.push($scope.orders[position+i]);
      }
    });
  };


}


})(window.angular);
