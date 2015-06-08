;(function(angular) {'use strict';

//
// Define the Order module (app.shop)  for controllers, services and models
// the app.shop module depend on app.config and take resources in shop/*.html
angular.module('app.order.widget', ['app.order.ui','app.config', 'app.api'])
  .controller('OrderWidgetCtrl',OrderWidgetCtrl);

OrderWidgetCtrl.$inject=['$scope','$routeParams','api','order','user','product','Map','config'];
function OrderWidgetCtrl($scope, $routeParams, api, order, user, product, Map, config) {
  // first time you enter a num, it clear the previous value
  var firstMustClean=true;

  var decimalPlaces=function(num) {
    var match = (''+num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
    if (!match) { return 0; }
    return Math.max(
       0,
       // Number of digits right of decimal point.
       (match[1] ? match[1].length : 0)
       // Adjust for scientific notation.
       - (match[2] ? +match[2] : 0));
  };


  $scope.$watch('filters', function(newVal, oldVal){
    $scope.item={finalprice:0};
  }, true);

  $scope.$watch('selectedItem', function(newVal, oldVal){
    if(newVal&&newVal.sku && oldVal.sku!==newVal.sku){
      $scope.item=newVal;
      $scope.savedPrice=newVal.finalprice;
    }
  }, true);

  //
  // 
  $scope.item={finalprice:0};
  $scope.items=[];
  $scope.dec=false;
  $scope.savedPrice=0;

  $scope.clear=function () {
    $scope.dec=false;
    $scope.item.finalprice=$scope.savedPrice;
    firstMustClean=true;
  };

  $scope.passNum=function (n) {
    if(firstMustClean){
      $scope.item.finalprice=0; 
      firstMustClean=false;
    }
    var finalprice=$scope.item.finalprice,
        dec=decimalPlaces(finalprice);

    if(dec>=2){
      return;
    }

    if($scope.dec){
      n/=Math.pow(10,dec+1);
    }else{
      finalprice*=10;      
    }
    finalprice+=n;
    $scope.item.finalprice=parseFloat(finalprice.toFixed(2));
  };

  $scope.passDec=function () {
    $scope.dec=true;
  };


  $scope.widgetCurrentItem=function (shops,shop) {
    var items=$scope.items=shops[shop];
    for (var i = items.length - 1; i >= 0; i--) {
      if(items[i].selected){
        $scope.item=items[i];
        return;
      }
    }
    $scope.item=items[0];
    $scope.item.selected=true;
  };

  $scope.widgetNextItem=function () {
    var items=$scope.items;
    if(!items.length)return;
    for (var i =0; i<items.length; i++) {
      if(items[i].selected){
        items[i].selected=false;
        $scope.item=items[(i+1)%items.length];
        $scope.item.selected=true;
        return;
      }
    }
  };

  $scope.widgetPreviousItem=function () {
    var items=$scope.items;
    console.log('widgetPreviousItem');
    if(!items.length)return;
    for (var i = items.length - 1; i >= 0; i--) {
      if(items[i].selected){
        items[i].selected=false;
        $scope.item=(!i)?items[items.length-1]:items[i-1];
        $scope.item.selected=true;
        return;
      }
    }
  };


}


})(window.angular);
