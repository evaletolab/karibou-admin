;(function(angular) {'use strict';

//
// Define the Home module (app.home)  for controllers, services and models
var Home=angular.module('app.home', [
  'app.config','app.user','app.shop', 'app.api'
]);


//
// define all routes for user api
Home.config([
  '$routeProvider',
  '$locationProvider',
  '$httpProvider',

  function ($routeProvider, $locationProvider, $httpProvider) {

    // List of routes of the application
    $routeProvider
      .when('/', { templateUrl : '/partials/product/home.html'})
      .when('/shops', {title:'Les boutiques ',  templateUrl : '/partials/shop/home.html'})
      .when('/products', {title:'Les produits ',  templateUrl : '/partials/product/home.html'})
      .when('/shops/category/:catalog', {title:'Les boutiques ',  templateUrl : '/partials/shop/shops.html'});
  }
]);


//
// the HomeCtrl is used in home.html (see app/assets/home.html)
Home.controller('HomeCtrl', [
  '$scope',
  '$route',
  '$location',
  '$rootScope',
  '$routeParams',
  '$q',
  'config',
  'api',
  'category',
  'user',
  'shop',
  'product',
  'Map',

  function ($scope, $route, $location, $rootScope, $routeParams, $q, config, api, category, user, shop, product, Map) {
    var filter={sort:'created'}, promise,scrollBusy=false;
    $scope.user = user;
    $scope.map=new Map();
    $scope.items=[];
    $scope.infinite=[];
    $scope.product=false;
    $scope.loves=false;

    $scope.shops.$promise.then(function () {
      // body...
    })

    //
    // generate a set of geo addresses to display map
    $scope.shopsAddress=function(shops){
      if(!shops){return;}
      var addresses=[];
      for (var i in shops){
        // for arrays
        if(shops[i].address&&shops[i].address.geo){
          addresses.push(shops[i].address);
          continue;
        }

        // for groups
        for (var j in shops[i]){
          if(shops[i][j].address&&shops[i][j].address.geo){
            addresses.push(shops[i][j].address);
          }
        }
      }
      //
      // 
      return addresses;
    };


    $scope.findAllUserLoves=function(){
      $scope.products=[];
      product.findLove({popular:true,minhit:2, available:true},function(products){
        $scope.products=products;
      });
    };    

    $scope.loadHome=function(){
      var deferred = $q.defer();


      //
      // list products by category
      if ($routeParams.category){
        $scope.group=category.findNameBySlug($routeParams.category);
        $scope.$parent.title="Les produits - "+$scope.group;
        filter={sort:'title',status:true,available:true};
        
        product.findByCategory($routeParams.category,filter,function(products){
          $scope.items=products;
          deferred.resolve(products);
        });
        return deferred.promise;
      }
      

      
      //
      // get shops for the front page
      if($location.path()==='/shops'){
        filter={};
        // admin filter
        if(!user.isAdmin()){filter.status=true;}
        shop.query(filter,function(shops){
          $scope.items=shops;
          $scope.addresses=$scope.shopsAddress(shops);
          deferred.resolve(shops);
        });
        return deferred.promise;
      } 

      //
      // get products in front page
      // /v1/products?available=true&group=categories.name&home=true&sort=categories.weight&status=true
      filter={popular:true, status:true, home:true, discount:true, available:true,maxcat:4};
      product.query(filter,function(products){
        $scope.items=products;
        deferred.resolve(products);
      });
      return deferred.promise;
    };


    $scope.getCategoryByName=function(name) {
      return category.find({name:name});
    }

    $scope.loadNextPage=function(){
      if($scope.scrollBusy) return;
      if(!promise){
       promise=$scope.loadHome();
       $scope.scrollBusy=true;
      } 


      // scroll
      promise.then(function(h){        
        var position=$scope.infinite.length;
        $scope.scrollBusy=false;
        for (var i = 0; i<8; i++) {
          if(($scope.infinite.length)>=$scope.items.length){
            return;
          }
          $scope.infinite.push($scope.items[position+i]);
        }
      });
    };
        
  }
]);

  
 
})(window.angular);
