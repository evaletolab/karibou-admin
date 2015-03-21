;(function(angular) {'use strict';

//
// Define the Order module (app.shop)  for controllers, services and models
// the app.shop module depend on app.config and take resources in shop/*.html
angular.module('app.order.admin', ['app.order.ui','app.config', 'app.api'])
  .controller('OrderAdminCtrl',OrderAdminCtrl)

OrderAdminCtrl.$inject=['$scope', '$routeParams','$location','api','order','user','product','$log', '$controller'];
function OrderAdminCtrl($scope,$routeParams, $location, api, order, user, product, $log, $controller) {
  $controller('OrderCommonCtrl', {$scope: $scope}); 



  $scope.countShops=function(shops){
    if(!shops)return;
    return Object.keys(shops).length
  }

  $scope.getAmountTotal=function (shop) {
    var total=0;
    if(!$scope.shops)return total;
    $scope.shops[shop].forEach(function (item) {
      if(item.fulfillment.status!=='failure'){
        total+=parseFloat(item.finalprice)
      }
    })
    return total
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
        item.rank=order.rank;
        item.oid=order.oid;
        item.email=order.email;
        item.customer=order.customer;
        item.created=order.created;
        item.fulfillments=order.fulfillments;
        item.when=order.shipping.when;
        shops[item.vendor].push(item);
      })
    })
    return shops
  }

  $scope.isCollectableShopForDay=function (shop,when) {
    if(!when||!$scope.shops) return true;
    var items=$scope.shops[shop].filter(function(item) {
      return (item.when===when);
    })
    return (items.length>0)
  }

  $scope.isCollectedShopForDay=function (shop,when) {
    for (var i = $scope.orders.length - 1; i >= 0; i--) {
      if($scope.orders[i].shipping.when===when){
        for (var j = $scope.orders[i].vendors.length - 1; j >= 0; j--) {
          if($scope.orders[i].vendors[j].slug===shop){
            return $scope.orders[i].vendors[j].collected;
          }
        };
      }
    };

    return false;
  }


  function findOrder(oid) {
      for (var i = $scope.orders.length - 1; i >= 0; i--) {
        if($scope.orders[i].oid===order.oid){return $scope.orders[i]}
      };
    return null;
  }


  $scope.isSelectedShop=function (shop) {
    if(!$scope.filters.s) return false;
    return ($scope.filters.s===shop)    
  }

  $scope.isProductDirty=function (product) {
    return (product.pricing._price!=product.pricing.price||
            product.pricing._stock!=product.pricing.stock||
            product.attributes._available!=product.attributes.available||
            product.attributes._home!=product.attributes.home)
  }

  $scope.initProductState=function(product){
    product._weight=product.weight;
    product.attributes._available=product.attributes.available;
    product.attributes._home=product.attributes.home;
    product.pricing._stock=product.pricing.stock;
    product.pricing._price=product.pricing.price;
  }

  $scope.getDetailledOrderUrl=function (when) {
    var params=($routeParams.closed)?'&closed='+$routeParams.closed:'';
    params+=($routeParams.fulfillments)?'&fulfillments='+$routeParams.fulfillments:'';
    return '/admin/shop/orders?groupby=shop&when='+when+params;
    // body...
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
      $log.info('capture result',order.oid, o)
      order.wrap(o)
    })
  }


  //
  // capture and close the order
  $scope.orderRefund=function(order){
    order.refund().$promise.then(function(o){
      api.info($scope,"Commande remboursée",2000);
      order.wrap(o)
    })
  }

  //
  // cancel and close the order
  $scope.orderDelete=function(order){
    order.remove().$promise.then(function(){
      api.info($scope,"Commande suprimmée",2000);
      for (var i = $scope.orders.length - 1; i >= 0; i--) {
        if($scope.orders[i].oid===order.oid){$scope.orders.splice(i,1)}
      };
    })
  }


  $scope.informShopToOrders=function(shop,content){
    order.informShopToOrders(shop,content).$promise.then(function(){
        api.info($scope,"Votre message à bien été envoyé! ");        
    });
  }
  


  $scope.updateItem=function(oid,item,fulfillment){
    for (var o in $scope.orders){
      if($scope.orders[o].oid===oid){
        return $scope.orders[o].updateItem(item,fulfillment).$promise.then(function(){
          api.info($scope,"Statut commande enregistré",2000);
          item.fulfillment.status=fulfillment;
        })
      }
    }
  }

  $scope.updateCollect=function (shopname,status,when) {
    order.updateCollect(shopname,status,when).$promise
      .then(function (order) {
        api.info($scope,"Collecte enregistrée",2000);
      })
  }


  //
  // get all orders
  $scope.findAllOrders=function(defaultParams){

    var filters=$scope.filters=angular.extend({},$routeParams,defaultParams||{});
    var today=new Date();
    if(!filters.month &&!filters.when)filters.month=today.getMonth()+1;
    $scope.loading=true;

    user.$promise.then(function(){

      //
      // is admin?
      if(!user.isAdmin()){
        filters.action='shops'
      }


      order.findAllOrders(filters).$promise.then(function(orders){
        $scope.orders=orders;filters.f=null;
        $scope.shops=false;
        $scope.addresses=orders.map(function(order){return order.shipping})
        $scope.dates=orders.map(function (order) {
          return ((order.shipping.when))
        }).filter(function(v,i,self) {
          return self.indexOf(v)===i;
        }).sort($scope.sortByDateDESC)

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
          filters.f=filters.when
        }
        // default date
        if($scope.dates.length && !filters.f){
          filters.f=$scope.dates[0]
        }


        //
        // group by shop?
        if(filters.groupby==='shop'){
          $scope.shops=$scope.groupByShops(orders)
          $scope.filters.s=Object.keys($scope.shops)[0]
        }
        $scope.loading=false;
      });

    });
  }

  $scope.saveProduct=function (product) {
    product.updateAndSave(function () {
      api.info($scope,"Produit enregistré :"+product.title,1000);
      $scope.initProductState(product)
    })
  }
  $scope.loadAllProducts=function(){
    $scope.loading=true
    user.$promise.then(function(){
      var params={sort:'categories.weight'};
      // filter with the user shop
      if(!user.isAdmin()){
        params.shopname=user.shops[0].urlpath
      }

      $scope.products=product.query(params,function(products){
        $scope.products=products;
        $scope.loading=false;
      });

    });
  }



}


})(window.angular);
