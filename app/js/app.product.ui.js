;(function(angular) {'use strict';

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
})


.filter('portion', function () {
   function round5(val){
      return parseInt(Math.round(val / 5) * 5)
   }
   return function(weight) {
        if (!weight) return "";
        var m=weight.match(/~([0-9]+)(.+)/);
        if(!m||m.length<2)return weight;
        var w=parseInt(m[1]), unit=(m[2]);
        return 'entre '+round5(w-w*.08)+unit+' et '+round5(w+w*.08)+''+unit;
   };
})

})(window.angular);



            
