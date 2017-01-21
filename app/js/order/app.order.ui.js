;(function(angular) {'use strict';

/**
 * Define the Product directives for (app.product)
 * provides directives for interacting with Product on views.
 */


angular.module('app.order.ui', [
  'app.config'
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
// display vendor acording the shipping date
// https://github.com/angular/angular.js/blob/master/src/ng/directive/ngShowHide.js
.directive('ifVendorIsAvailable', ['$parse','$timeout','cart', 
function($parse, $timeout,cart) {

  return {
    restrict: 'A',
    replace: true, 
    scope:{ifVendorIsAvailable:'='},
    priority:1,
    link: function(scope, element, attrs) {
      var self=this;

      scope.$watch(function() {
        return cart.getShippingDay();
      }, function(nextShippingDay) {
        //
        // no livraison
        if(!nextShippingDay||!scope.ifVendorIsAvailable){
          if(attrs.reverse) return element.hide();
          return element.show();
        }


        var display=(scope.ifVendorIsAvailable.available.weekdays.indexOf(nextShippingDay.getDay())!==-1);

        //
        // with shipping
        if(attrs.reverse){
          display=!display;
        }

        if(display){element.show();}else{element.hide();}          

      });

    }
  };

}])

//
// clockdown for the next shipping day
.directive('clockdown', ['$parse','$timeout','order','config','cart', 
  function($parse, $timeout,order,config,cart) {

  return function(scope, element, attr) {
    //
    // config is an asynchrone load
    config.shop.then(function(){
      var append = attr.clockdown||'';
      var opts=$parse(attr.clockdownOpts||'')(scope)||{};
      var postfix='';

      scope.$watch(function() {
        return cart.getShippingDay();
      }, function(nextShippingDay) {
        //
        // no livraison
        if(!nextShippingDay)return element.html('livraisons interrompus');

        var date=moment(nextShippingDay);

        //
        // with shipping
        if(opts.long){
          postfix=' le '+date.format('dddd D', 'fr');
        }
        if(opts.custom){
          return element.html(append+' '+date.format(opts.custom,'fr'));          
        }

        element.html(append+' '+date.fromNow()+postfix);

      });

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

.filter('giftCodeTotal',['config',function (config) {
  return function (gift,sum) {
    if(!gift||!gift.amount){
      return '0.00';
    }
    // important
    var amount=parseFloat(gift.amount);
    if(gift.print){
      amount+=1;
    }
    var issuer=gift.payment&&gift.payment.issuer||'none';

    for(var p in config.shop.order.gateway){
      if(config.shop.order.gateway[p].label===issuer){
        var fees=(config.shop.order.gateway[p].fees*amount);
        return (sum)?(amount+fees).toFixed(2):fees.toFixed(2);
      }
    }
    return (sum)?(amount).toFixed(2):'0.00';
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
   return function(order, widthDiscount) {
        if (!order||!order.items.length) {return "0.0 CHF";}



        var fees=0.0,
            total=order.getSubTotal(), 
            shipping=order.getShippingPrice(),
            discount=order.getTotalDiscount();


        // before the payment fees! 
        // add shipping fees 
        total+=shipping;

        // 
        // remove discount offer by shop
        total-=discount;


        //
        // add gateway fees
        fees=order.getFees(total);

        // add shipping amount fees 
        fees+=shipping;

        // display total fees with discount
        if(widthDiscount){
          fees=Math.max(fees-discount,0);
        }

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
