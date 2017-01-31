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

angular.module('app.product.ui', ['app.config', 'app.api'])
  .filter('portionBase',portionBase)
  .filter('portion',portion)
  .filter('leanProducts',leanProducts)
  .directive("cartButton",cartButton)
  .directive("productQuantity",productQuantity)
  .directive("productProperty",productProperty)
  .directive("productState",productState);

//
// limite the set of products (groupBy category) to N elements
// implement filter 
leanProducts.$inject=[];
function leanProducts() {
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
}


//
// filter 
portionBase.$inject=[];
function portionBase() {
 return function(weight, price) {
    if (!weight ||!price){ 
      return "";
    }
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
   }
}


//
// filter 
portion.$inject=[];
function portion() {
   return function(weight,def) {
    if(!def)def='';
    if (!weight) return "";
    var m=weight.match(/~([0-9.]+) ?(.+)/);
    if(!m&&def)m=def.match(/~([0-9.]+) ?(.+)/);
    if(!m||m.length<2)return '';
    var w=parseFloat(m[1]), unit=(m[2]).toLowerCase();
    return 'une portion entre '+roundN(w-w*0.07)+unit+' et '+roundN(w+w*0.07)+''+unit;
   };
}



//
// directive 
/*jshint multistr: true */
cartButton.$inject=['$compile','$timeout','cart'];
function cartButton($compile,$timeout,cart) {
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
  }

}

//
// directive product state
// use transclude instead,
// - http://stackoverflow.com/questions/22584357/angularjs-is-there-a-difference-between-transclude-local-in-directive-controll 
productProperty.$inject=['$compile','$interval','user','cart'];
function productProperty($compile,$interval,user,cart) {
  return {
    restrict: 'A',
    priority:1,
    link: function(scope, element, attrs, ngModelCtrl) {
      var self, 
          property=attrs.productProperty;

      // scope.$watch(function() {
      //   return scope.$parent.product;
      // },function (product) {
      //   // body...
      // }

      //
      function toFixed(val,fixed) {
        if(val===undefined)return '0.00';
        return Number(val).toFixed(fixed);
      }

      var product=scope.$parent.product;
      if(product){
        $interval.cancel(handle);
        switch(property){
          case 'title':
          return element.html(product.title);
          case 'vendor-name':
          return element.html(product.vendor.name);
          case 'price-part':
          return element.html(product.pricing.part);
          case 'price':
          return element.html(toFixed(product.pricing.price,2));
          case 'discount':
          return element.html(toFixed(product.pricing.discount,2));
        }
      }

    }
  }
}


//
// directive product state
productState.$inject=['$compile','$rootScope','user','cart'];
function productState($compile,$rootScope,user,cart) {
  return {
    restrict: 'A',
    scope:{productState:'='},
    priority:1,
    link: function(scope, element, attrs, ngModelCtrl) {
      var self=this, 
          classes={},
          classOn=[],
          classOff=[],
          target=attrs.productStateQuantity;

      //
      // http://stackoverflow.com/questions/5330420/why-cant-i-use-tofixed-on-an-html-input-objects-value
      function toFixed(val,fixed) {
        if(val===undefined)return '0.00';
        return Number(val).toFixed(fixed);
      }

      scope.$watch(function() {
        var product=scope.productState;
        if(!product||!product.sku)return 0;
        return cart.findBySku(product.sku).quantity;
      }, function (quantity) {
        
        if(quantity){
          if(target)element.find(target).html(quantity);
          return element.addClass('product-cart');
        }  

        element.removeClass('product-cart');

      });

      scope.$watch('productState', function (product) {
        if (product && product.sku ) {

          classes['product-available']=product.isAvailableForOrder();
          classes['product-cart']=(cart.findBySku(product.sku).quantity>0);
          classes['product-vendor-closed']=product.vendor&&product.vendor.available.active;
          classes['product-love']=user.hasLike(product);
          classes['product-discount']=product.attributes.discount;
          classes['product-photo']=(product.photo.url);
          classes['product-stock']=(product.pricing.stock>0);
          classes['product-variant']=(product.variants.length>0);

          // init
          classOn=[],classOff=[]
          // classNames=element[0].className.split(' ');
          // keep classes
          Object.keys(classes).forEach(function(name) {
            if(classes[name]) {classOn.push(name);} else {classOff.push(name);}
          })
          element.addClass(classOn.join(' '))
          element.removeClass(classOff.join(' '))

          //
          // update fields
          element.find('.product-title').html(product.title);
          element.find('.product-vendor-name').html(product.vendor.name);
          element.find('.product-part').html(product.pricing.part);
          element.find('.product-price').html(toFixed(product.pricing.price,2));
          element.find('.product-discount').html(toFixed(product.pricing.discount,2));



        }
      });
    }
  };
}



//
// directive product quantity
productQuantity.$inject=['$compile','$timeout','cart'];
function productQuantity($compile,$timeout,cart) {
  return {
    restrict: 'A',
    scope:{productQuantity:'='},
    priority:1,
    link: function(scope, element, attrs, ngModelCtrl) {
      var self=this, sku;

      //
      // watch quantity
      scope.$watch(function() {
        sku=scope.productQuantity&&scope.productQuantity.sku||0;
        return cart.findBySku(sku).quantity;
      }, function (quantity) {
        if(!quantity){
          return element.hide();
        }
        element.show();
        element.html(quantity);
      });
    }
  }
}

})(window.angular);



            
