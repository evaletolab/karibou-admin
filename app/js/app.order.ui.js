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
      var nextShippingDay=order.findNextShippingDay(),
          delta=nextShippingDay.getTime()-Date.now(),
          timer,
          append = attr['clockdown']||'';

      element.html(append+' '+moment(nextShippingDay).format('dddd D MMMM', 'fr'))
      // timer=setInterval(function(){
      //   delta--;
      //   element.html(append+' '+moment(nextShippingDay).fromNow())
      // },1000)
    });
  }
}])


.filter('dateLabel', function () {
   return function(shipping, prefix) {
        if (!shipping) return "";
        if (!prefix) prefix="";

        var date=(shipping.when)?shipping.when:shipping,
            time=(shipping.time)?' de '+shipping.time:''
        return  prefix+moment(date).format('ddd DD MMM YYYY', 'fr')+time;
   };
})

.filter('dateLabelShort', function () {
   return function(shipping, prefix) {
        if (!shipping) return "";
        if (!prefix) prefix="";

        var date=(shipping.when)?shipping.when:shipping,
            time=(shipping.time)?' de '+shipping.time:''
        return  prefix+moment(date).format('ddd DD MMM', 'fr')+time;
   };
})


.filter('orderInitial', function () {
   return function(order) {
        if (!order||!order.items.length) return "0.0 CHF";
        var price=0.0;
        for (var i in order.items){
          price+=parseFloat(order.items[i].price)*order.items[i].quantity
        }
        return price.toFixed(2)+" CHF"
   };
})


.filter('orderFees', ['config',function (config) {
   return function(order) {
        if (!order||!order.items.length) return "0.0 CHF";

        var fees=0.0,total=0.0;
        this.items&&this.items.forEach(function(item){
          if(item.fulfillment!=='failure'){
            total+=item.finalprice;
          }
        });

        //
        // add gateway fees
        for (var gateway in config.shop.order.gateway){
          gateway=config.shop.order.gateway[gateway]
          if (gateway.label===order.payment.issuer){
            fees+=total*gateway.fees;
            break;
          }
        }

        // add shipping fees (10CHF)
        fees+=config.shop.marketplace.shipping;

        return parseFloat((Math.round(fees*20)/20).toFixed(2))+" CHF";


   };
}])


.filter('orderTotal', function () {
   return function(order) {
        if (!order||!order.items.length) return "0.0 CHF";
        var price=0.0;
        for (var i in order.items){
          price+=parseFloat(order.items[i].finalprice)
        }
        return price.toFixed(2)+" CHF"
   };
});


})(window.angular);
