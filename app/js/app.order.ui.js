
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

      timer=setInterval(function(){
        delta--;
        element.html(append+' '+moment(nextShippingDay).fromNow())
      },1000)
    });
  }
}]);


