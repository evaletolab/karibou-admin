;(function(angular) {'use strict';

//
// Define the Order module (app.shop)  for controllers, services and models
// the app.shop module depend on app.config and take resources in shop/*.html
angular.module('app.order.manager', ['app.order.ui','app.config', 'app.api'])
  .controller('OrderAdminCtrl',OrderAdminCtrl);

OrderAdminCtrl.$inject=['$scope', '$routeParams','$timeout','$http','api','order','user','product','config','$log', '$controller','$q'];
function OrderAdminCtrl($scope,$routeParams, $timeout, $http, api, order, user, product, config, $log, $controller,$q) {
  $controller('OrderCommonCtrl', {$scope: $scope}); 



  $scope.addresses=[];

  $scope.options.orderByField=null;


  //
  // used by collect
  $scope.groupByShops=function(orders){
    var shops={};
    orders.forEach(function(order){
      order.items.forEach(function(item){

        // init item for this shop
        if(!shops[item.vendor]){
          shops[item.vendor]=[];
        }
        // add item to this shop
        item.rank=order.rank;
        item.oid=order.oid;
        item.email=order.email;
        item.customer=order.customer;
        item.created=order.created;
        item.fulfillments=order.fulfillments;
        item.when=order.shipping.when;
        shops[item.vendor].push(item);
      });
    });
    return shops;
  };

  //
  // select order 
  $scope.selectOrder=function (o) {
    if($scope.selected.order&&$scope.selected.order.oid===o.oid){
      $scope.selected.order=false;
      return $scope.selected.items=[];
    }
    $scope.selected.items=o.items;
    $scope.selected.order=o;
  };

  $scope.selectNextOrder=function () {
    $timeout(function () {
      $('li.list-group-item-active').next().find('div.list-group-item-text').click()  // body...
    })
  };

  $scope.hasNextOrder=function () {
    return $('li.list-group-item-active').next().length;
  };



  //
  // compute amount for a selected shop
  $scope.getAmountTotal=function (items) {
    var total=0;
      items.forEach(function (item) {
        if(item.fulfillment.status!=='failure'){
          total+=parseFloat(item.finalprice);
        }
      });
    return total.toFixed(2);
  };


  $scope.isCollectableShopForDay=function (shop,when) {
    if(!when||!$scope.shops) return true;
    var items=$scope.shops[shop].filter(function(item) {
      return (item.when===when);
    });
    return (items.length>0);
  };

  $scope.isCollectedShopForDay=function (shop,when) {
    for (var i = $scope.orders.length - 1; i >= 0; i--) {
      if($scope.orders[i].shipping.when===when){
        for (var j = $scope.orders[i].vendors.length - 1; j >= 0; j--) {
          if($scope.orders[i].vendors[j].slug===shop){
            return $scope.orders[i].vendors[j].collected;
          }
        }
      }
    }

    return false;
  };




  $scope.isSelectedShop=function (shop) {
    if(!$scope.filters.s) return false;
    return ($scope.filters.s===shop);    
  };

  $scope.isProductDirty=function (product) {
    return (product.pricing._price!=product.pricing.price||
            product.pricing._stock!=product.pricing.stock||
            product.attributes._discount!=product.attributes.discount||
            product.attributes._available!=product.attributes.available||
            product.attributes._home!=product.attributes.home);
  };

  $scope.initProductState=function(product){
    product._weight=product.weight;
    product.attributes._available=product.attributes.available;
    product.attributes._home=product.attributes.home;
    product.attributes._discount=product.attributes.discount;
    product.pricing._stock=product.pricing.stock;
    product.pricing._price=product.pricing.price;
  };

  $scope.getDetailledOrderUrl=function (when) {
    var params=($routeParams.closed)?'&closed='+$routeParams.closed:'';
    params+=($routeParams.fulfillments)?'&fulfillments='+$routeParams.fulfillments:'';
    return '/admin/shop/orders?groupby=shop&when='+when+params;
    // body...
  };

  // deprecated
  $scope.isInputItemPriceDisabled=function(item){
    var orderDisabled=(item.fulfillments&&item.fulfillments.status==='failure');
    var itemDisabled=(['fulfilled'].indexOf(item.fulfillment.status)!==-1);
    return itemDisabled||orderDisabled;
  };

  //
  // display pay button when order is fulfilled
  $scope.showCaptureButton=function(order){
    if(!user.isAdmin()) return false;
    return (['voided','paid','invoice'].indexOf(order.payment.status)===-1) && (order.fulfillments.status==='fulfilled');
  };


  //
  // capture and close the order
  $scope.orderCapture=function(order){
    order.capture().$promise.then(function(o){
      api.info($scope,"Commande capturée",2000);
      $log.info('capture result',order.oid, o);
      order.wrap(o);
    });
  };

  //
  // capture and close the order
  $scope.orderNewInvoice=function(order){
    order.capture({reason:'invoice'}).$promise.then(function(o){
      api.info($scope,"Nouvelle facture capturée",2000);
      $log.info('new invoice result',order.oid, o);
      order.wrap(o);
    });
  };

  //
  // capture and close the order
  $scope.orderRefund=function(order){
    order.refund().$promise.then(function(o){
      api.info($scope,"Commande remboursée",2000);
      order.wrap(o);
    });
  };

  //
  // capture and close the order
  $scope.orderRefund=function(order,amount){
    order.refund(amount).$promise.then(function(o){
      api.info($scope,"Commande remboursée",2000);
      order.wrap(o);
    });
  };

  //
  // cancel and close the order
  $scope.orderDelete=function(order){
    order.remove().$promise.then(function(){
      api.info($scope,"Commande suprimmée",2000);
      for (var i = $scope.orders.length - 1; i >= 0; i--) {
        if($scope.orders[i].oid===order.oid){$scope.orders.splice(i,1);}
      }
    });
  };


  $scope.informShopToOrders=function(shop,when,fulfillment){
    order.informShopToOrders(shop,when,fulfillment).$promise.then(function(contents){
        var count=Object.keys(contents).length;
        api.info($scope,"Votre message à bien été envoyé! ("+count+" boutiques)");        
    });
  };
  


  $scope.updateItem=function(oid,item,fulfillment){
    var self=order.find(oid);
    self.updateItem(item,fulfillment).$promise.then(function(o){
      api.info($scope,"Statut commande enregistré",2000);
      item.fulfillment.status=fulfillment;
      self.fulfillments=o.fulfillments;
    });
  };

  $scope.updateCollect=function (shopname,status,when) {
    order.updateCollect(shopname,status,when).$promise
      .then(function (os) {
        api.info($scope,"Collecte enregistrée",2000);
      });
  };


  //
  // get all orders
  $scope.findAllOrders=function(defaultParams){

    var filters=$scope.filters=angular.extend({},$routeParams,defaultParams||{padding:true});
    var today=new Date();
    if(!defaultParams&&!filters.month &&!filters.when)filters.month=today.getMonth()+1;
    $scope.loading=true;

    $q.all([config.shop,user.$promise]).then(function(){

      //
      // is admin?
      if(!user.isAdmin()){
        filters.action='shops';
      }


      order.findAllOrders(filters).$promise.then(function(orders){
        $scope.orders=orders;filters.f=null;
        $scope.shops=false;

        //
        // get addresses
        $scope.shopAddresses=orders.map(function(order){return order.vendors;});
        $scope.shopAddresses=_.flatten($scope.shopAddresses);
        $scope.addresses=orders.map(function(order){return order.shipping;});
        $scope.dates=orders.map(function (order) {
          return ((order.shipping.when));
        }).filter(function(v,i,self) {
          return self.indexOf(v)===i;
        }).sort($scope.sortByDateDESC);

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
        if(filters.when){
          filters.f=filters.when;
        }
        // default date
        if($scope.dates.length && !filters.f){
          filters.f=$scope.dates[0];
        }


        //
        // list shop
        $scope.shops=[];
        orders.forEach(function (order) {
          order.vendors.forEach(function (vendor) {
            if($scope.shops.indexOf(vendor.slug)===-1){
              $scope.shops.push(vendor.slug)
            }
          })
        });
        
        if($scope.shops.length===1){
          $scope.filters.s=$scope.shops[0];
        }
        //
        // group by shop?
        if(filters.groupby==='shop'){
          $scope.shops=$scope.groupByShops(orders);
          if(!filters.s)$scope.filters.s=Object.keys($scope.shops)[0];
        }

        $scope.loading=false;
      });

    });
  };

  $scope.saveProduct=function (product) {
    product.updateAndSave(function () {
      api.info($scope,"Produit enregistré :"+product.title,1000);
      $scope.initProductState(product);
    });
  };

  $scope.loadActivities=function (activity) {
    $scope.activities=[];
    $http({url:$scope.config.API_SERVER+'/v1/activities',method:'GET',params:activity}).success(function(activities){
      $scope.activities=activities;
    })

  };

  $scope.loadAllProducts=function(){
    $scope.loading=true;
    $scope.options.orderByField='pricing.stock';


    user.$promise.then(function(){
      var params={sort:'categories.weight',shopname:$scope.filters.shops};
      // filter with the user shop
      if(!user.isAdmin()){
        params.shopname=user.shops[0].urlpath;
      }

      $scope.products=product.query(params,function(products){
        $scope.products=products;
        $scope.loading=false;
      });

    });
  };



}


})(window.angular);
