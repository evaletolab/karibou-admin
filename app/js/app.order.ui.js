
/**
 * Define the Product directives for (app.product) 
 * provides directives for interacting with Product on views.
 */


angular.module('app.order.ui', [
  'app.config', 
  'app.api'
])

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
});





