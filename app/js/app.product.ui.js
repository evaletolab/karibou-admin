
/**
 * Define the Product directives for (app.product) 
 * provides directives for interacting with Product on views.
 */

function init($scope, elem, product){

        
}

angular.module('app.product.ui', [
  'app.config', 
  'app.api'
])

.directive("product", function () {
  return {
      restrict: 'E',
      link: function(scope, element, attrs)
      {
          scope.$watch( 'product', function(product) {
              
              if(product){
                init(scope,element, product);
              }
           
          }, true );
      }
  };
});






            
