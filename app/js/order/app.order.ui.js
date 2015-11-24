;(function(angular) {'use strict';

/**
 * Define the Product directives for (app.product)
 * provides directives for interacting with Product on views.
 */


angular.module('app.order.ui', [
  'app.config',
  'app.api'
])

//
// print order fullfilment progress
.directive("orderProgress", function () {
  return {
      restrict: 'A',
      scope: {order: "&orderProgress"},
      link: function(scope, element, attrs, model){
        var order=scope.order();
        if(!order||!order.items.length){
          return;
        }


        return element.width(order.getProgress()+"%");
      }
  };
})


//
// clockdown for the next shipping day
.directive('clockdown', ['$parse','$timeout','order','config', function($parse, $timeout,order,config) {

  return function(scope, element, attr) {
    //
    // config is an asynchrone load
    config.shop.then(function(){
      if(config.shop.maintenance.active){
        return  element.html(config.shop.maintenance.reason);
      }

      var nextShippingDay=order.findNextShippingDay(),
          delta=nextShippingDay.getTime()-Date.now(),
          timer,
          append = attr.clockdown||'';

      element.html(append+' '+moment(nextShippingDay).format('dddd D MMMM', 'fr'));
    });
  };
}])

.filter('gatewayFees',['config',function (config) {
  return function (issuer,amount,sum) {
    if(!issuer||!amount){
      return '0.00';
    }
    // important
    amount=parseFloat(amount);
    for(var p in config.shop.order.gateway){
      if(config.shop.order.gateway[p].label===issuer){
        var fees=(config.shop.order.gateway[p].fees*amount);
        return (sum)?(amount+fees).toFixed(2):fees.toFixed(2);
      }
    }
  };
}])


.filter('filterItemsByShop', function () {
   return function(items,vendor) {
        if(!items||!items.length||!vendor){
          return items;
        }
        var lst=[];
        items.forEach(function (item) {
          if(item.vendor===vendor){
            lst.push(item);
          }
        });
        return lst;
   };
})

.filter('mapOrdersByShop', function () {
   return function(orders) {
        if(!orders||!orders.length){
          return [];
        }
        var lst=[];
        orders.forEach(function (order) {
          order.vendors.forEach(function (vendor) {
            if(lst.indexOf(vendor.slug)===-1){
              lst.push(vendor.slug);
            }
          });
        });
        return _.uniq(lst).sort();
   };
})

.filter('filterOrdersByShop', function () {
   return function(orders,vendor) {
        if(!orders||!orders.length||!vendor){
          return orders;
        }
        var lst=[];
        orders.forEach(function (order) {
          order.items.every(function (item) {
            if(item.vendor===vendor){
              lst.push(order);
              return false;
            }
            return true;
          });
        });
        return lst;
   };
})

.filter('dateLabel', function () {
   return function(shipping, prefix) {
        if (!shipping) {return "";}
        if (!prefix) {prefix="";}

        var date=(shipping.when)?shipping.when:shipping,
            time=(shipping.time)?' de '+shipping.time:'';
        return  prefix+moment(date).format('ddd DD MMM YYYY', 'fr')+time;
   };
})

.filter('dateLabelShort', function () {
   return function(shipping, prefix) {
        if (!shipping) {return "";}
        if (!prefix) {prefix="";}

        var date=(shipping.when)?shipping.when:shipping,
            time=(shipping.time)?' de '+shipping.time:'';
        return  prefix+moment(date).format('ddd DD MMM', 'fr')+time;
   };
})


.filter('orderInitial', function () {
   return function(order) {
        if (!order||!order.items.length) {return "0.0 CHF";}
        var price=0.0;
        for (var i in order.items){
          price+=parseFloat(order.items[i].price)*order.items[i].quantity;
        }
        return price.toFixed(2)+" CHF";
   };
})


.filter('orderFees', ['config',function (config) {
   return function(order) {
        if (!order||!order.items.length) {return "0.0 CHF";}

        // get shipping price amount
        var shipping=order.getShippingPrice();


        var fees=0.0,total=0.0;
        if(order.items){
          order.items.forEach(function(item){
            if(item.fulfillment.status!=='failure'){
              total+=item.finalprice;
            }
          });
        }

        //
        // add gateway fees
        for (var gateway in config.shop.order.gateway){
          gateway=config.shop.order.gateway[gateway];
          if (gateway.label===order.payment.issuer){
            fees+=(total+shipping)*gateway.fees;
            break;
          }
        }

        // add shipping amount fees 
        fees+=shipping;

        return parseFloat((Math.round(fees*20)/20).toFixed(2))+" CHF";


   };
}])

.filter('orderProgress',function(){
  return function (order) {

    //
    // end == 100%
    var end=order.items.length+2;
    var progress=0;
    //
    // failure, create, partial, fulfilled
    if(['fulfilled','failure'].indexOf(order.fulfillments.status)!==-1){
      return 100.00;
    }
    progress++;

    //
    // pending, paid, voided, refunded
    if(order.payment.status==='pending'){
      return (progress/end*100.00);
    }

    //
    // progress order items
    progress++;
    for (var i in order.items){
      if(['fulfilled','failure'].indexOf(order.items[i].fulfillment.status)!==-1){
        progress++;
      }
    }
    return (progress/end*100.00);

  };
})

.filter('orderTotal', function () {
   return function(order) {
        if (!order||!order.items.length) {return "0.0 CHF";}
        var price=0.0;
        for (var i in order.items){
          if(order.items[i].fulfillment&&order.items[i].fulfillment.status!=='failure'){
            price+=parseFloat(order.items[i].finalprice);
          }
        }
        return price.toFixed(2)+" CHF";
   };
});


})(window.angular);
