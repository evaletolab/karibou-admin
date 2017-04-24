;(function(angular) {'use strict';

/**
 * Define the Shop directives for (app.shop) 
 * provides directives for interacting with Shop on views.
 */
var UI=angular.module('app.shop.ui',['app.config']);



UI.filter('randomFilter', function() {
    var rnd=-1;
    return function (input, elem) {
      if (!Array.isArray(input) || !input.length ) 
        return input;


      elem=elem||1;
      var out=[], i=0;

      if(rnd===-1&&input.length){
        do{
	        rnd=Math.floor(Math.random()*input.length);
        }while(input[rnd].status!==true||(input[rnd].available&&input[rnd].available.active==true))
      }
      for (; i < elem; i++) {
        out.push(input[rnd]);
      };
      
      return out;
    };
});



})(window.angular);
