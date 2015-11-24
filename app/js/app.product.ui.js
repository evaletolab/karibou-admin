;(function(angular) {'use strict';


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

//
// limite the set of products (groupBy category) to N elements
// 
.filter('leanProducts', function() {
    return function (input, size) {
      if (!Array.isArray(input) || !input.length ) 
        return input;

      //
      // the default size is 6
      size=size||6;
      var out=[], i=0, group={}, elems=[], subSize=0;

      //
      // order elements
      for (var i = input.length - 1; i >= 0; i--) {
        if(!group[input[i].categories.name]){
          group[input[i].categories.name]=[];
        }
        group[input[i].categories.name].push(input[i]);
      };

      Object.keys(group).forEach(function (cat) {
        // for each Shop
        elems=group[cat];subSize=parseInt((elems.length/input.length)*size+.5);
        if(subSize>elems.length){
          subSize=elems.length;
        }
        for (var i = 0; i < subSize; i++) {
          out.push(elems[i]);
        };

      });
      
      return out;
    };
})


/*jshint multistr: true */
.directive("cartButton",['$compile','$timeout','cart',function($compile,$timeout,cart) {
    var tmplSingle='<a class="btn btn-primary _btClass" ng-click="cart.add(product)" ng-disabled="WaitText"\
                      ng-show="product.isAvailableForOrder()&& product.pricing.stock">\
                    <i ng-class="{\'fa fa-ellipsis-h\':CartText, \'fa fa-ok \':!CartText}"></i>\
                    &nbsp;J\'achète \
                  </a>';
    var tmplMultiple='<div class="btn-group btn-block" >\
                    <button type="button" class="btn btn-primary _btClass dropdown-toggle" data-toggle="dropdown" aria-expanded="false"\
                     ng-show="product.isAvailableForOrder()&& product.pricing.stock">\
                     <i ng-class="{\'fa fa-ellipsis-h\':CartText, \'fa fa-ok \':!CartText}"></i>\
                      &nbsp;J\'achète \ <span class="caret"></span>\
                    </button>\
                    <ul class="dropdown-menu" role="menu">\
                      <li><span>Choisir une option</span></li>\
                      <li ng-repeat="variant in product.variants"><a href="#" ng-click="cart.add(product,variant.title)">{{variant.title}}</a></li>\
                    </ul>\
                  </div>';


    var tmplMultipleSm='<div class="btn-group btn-block" >\
                    <button type="button" class="btn btn-primary _btClass dropdown-toggle" data-toggle="dropdown" aria-expanded="false"\
                     ng-show="product.isAvailableForOrder()&& product.pricing.stock">\
                     <i ng-class="{\'fa fa-ellipsis-h fa-2x\':CartText, \'fa fa-plus fa-2x \':!CartText}"></i>\
                    </button>\
                    <ul class="dropdown-menu" role="menu">\
                      <li><span>Choisir une option</span></li>\
                      <li ng-repeat="variant in product.variants">\
                        <a href="#" ng-click="cart.add(product,variant.title)">{{variant.short}}</a>\
                      </li>\
                    </ul>\
                  </div>';


    var tmplSingleSm='<a class="btn btn-transparent green" ng-click="cart.add(product)">\
              <i ng-class="{\'fa fa-ellipsis-h fa fa-2x\':CartText, \'fa fa-plus fa fa-2x \':!CartText}"></i>\
            </a>';


  return {
    restrict: 'E',
    replace: true, // replace element, or nested element
    scope:true,
    require:'ngModel',
    priority:1,
    link: function(scope, element, attrs, ngModelCtrl) {
      var self=this, small=attrs.btSmall!==undefined;
      // this is not working, the element 
      if(attrs.btSmall!==undefined){
        // tmplMultiple=tmplMultipleSm;
        // tmplSingle=tmplSingleSm;          
      }
      ngModelCtrl.$render=function () {
        // init scope (this is not well done, waiting for state is ugly, FIXME)
        var wait=(ngModelCtrl.$viewValue.sku)?0:1000;

        $timeout(function () {
          scope.small=small;
          scope.cart=cart;
          var product=scope.product=ngModelCtrl.$viewValue;
          //
          // select template

          var template=(product.variants&&product.variants.length)?tmplMultiple:tmplSingle;
          //
          // replace btClass
          var btClass=attrs.btClass||'';
          template=template.replace(/_btClass/g, btClass);

          // angular.element('#'+attrs.id).html(el);
          var el = $compile(template)(scope);
          // element.html(el);
          element.replaceWith(el);
        },wait);
      };
    }
  };
}])

.filter('portionBase', function () {
   return function(weight, price) {
        if (!weight ||!price) return "";
        var portion=weight.split(/(kg|gr|ml)/i);
        var w=(portion[0][0]==='~')?parseFloat(portion[0].substring(1)):parseFloat(portion[0]);
        if(portion.length<2){
          return;
        }
        var unit=(portion[1]).toLowerCase();
        if(unit!=='gr'){
          return;
        }

        var out=Math.round((100*price/w)*20)/20;
        return parseFloat(out).toFixed(2);

   };
})

.filter('portion', function () {
   return function(weight,def) {
        if(!def)def='';
        if (!weight) return "";
        var m=weight.match(/~([0-9.]+) ?(.+)/);
        if(!m&&def)m=def.match(/~([0-9.]+) ?(.+)/);
        if(!m||m.length<2)return '';
        var w=parseFloat(m[1]), unit=(m[2]).toLowerCase();
        return 'une portion entre '+roundN(w-w*0.07)+unit+' et '+roundN(w+w*0.07)+''+unit;
   };
});

})(window.angular);



            
