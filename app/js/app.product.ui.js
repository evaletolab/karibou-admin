;(function(angular) {'use strict';

/**
 * Define the Product directives for (app.product) 
 * provides directives for interacting with Product on views.
 */

function init($scope, elem, product){

        
}

function roundN(val){
  if(val<=5){
    return val.toFixed(1);
  }
  if(val<=50){
    return Math.round(val);
  }
  var N=5;
  return (Math.round(val / N) * N);
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

.filter('portionBase', function () {
   function roundN(val){
      if(val<=5){
        return val.toFixed(1);
      }
      if(val<=50){
        return Math.round(val);
      }
      var N=5;
      return (Math.round(val / N) * N);
   }
   return function(weight, price) {
        if (!weight ||!price) return "";
        var portion=weight.split(/(kg|gr)/i);
        var w=(portion[0][0]==='~')?parseFloat(portion[0].substring(1)):parseFloat(portion[0]);
        if(portion.length<2){
          return;
        }
        var unit=(portion[1]).toLowerCase();
        if(unit!=='gr'){
          return;
        }
        var out=roundN(price/w*100)+0;
        return parseFloat(out).toFixed(2);

   };
})

.filter('portion', function () {
   return function(weight,def) {
        if(!def)def='';
        if (!weight) return "";
        var m=weight.match(/~([0-9.,]+) ?(.+)/);
        if(!m&&def)m=def.match(/~([0-9.,]+) ?(.+)/);
        if(!m||m.length<2)return '';
        var w=parseFloat(m[1]), unit=(m[2]).toLowerCase();
        return 'portion entre '+roundN(w-w*0.07)+unit+' et '+roundN(w+w*0.07)+''+unit;
   };
});

})(window.angular);



            
