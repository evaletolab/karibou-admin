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
  'document',
  'Map',

  function ($scope, $route, $location, $rootScope, $routeParams, $q, config, api, category, user, shop, product,document, Map) {
    var filter={sort:'created'};
    $scope.user = user;
    $scope.map=new Map();
    $scope.infinite={};
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
      var deferred = $q.defer(), waitmylove={$promise:$q.when(true)};

      function resolve (value) {
          waitmylove.$promise.finally(function (value) {
            deferred.resolve(value);
          });
      }

      //
      // list popular product for the current user
      if(!$routeParams.category&&user.isAuthenticated()){
        waitmylove=$scope.loves=product.findLove({popular:true,minhit:2, available:true},function(products){
          $scope.loves=products;
        });
      }


      // $scope.loves.$promise.then(function (loves) {
      //   console.log('get :mylove')
      // });

      //
      // list products by category
      if ($routeParams.category){
        $scope.group=category.findNameBySlug($routeParams.category);
        $scope.$parent.title="Les produits - "+$scope.group;
        filter={sort:'title',status:true,available:true};
        
        $scope.products=product.findByCategory($routeParams.category,filter,function(products){
          $scope.items=$scope.products=products;
          resolve(products);
        });
        return deferred.promise;
      }
      
      //
      // list shops by catalog
      if($routeParams.catalog){
        $scope.group=category.findNameBySlug($routeParams.catalog);
        $scope.$parent.title="Les boutiques - "+$scope.group;
        filter={sort:'created'};
        
        $scope.shops=shop.findByCatalog($routeParams.catalog,filter,function(shops){
          $scope.items=$scope.shops=shops;
          $scope.addresses=$scope.shopsAddress(shops);
          resolve(shops);
        });
        return deferred.promise;
      }

      
      //
      // get shops for the front page
      if($location.path()==='/shops'){
        filter={sort:'created',group:'catalog.name'};
        if(!user.isAdmin()){
          filter.status=true;
        }
        $scope.shops=shop.home(filter,function(shops){
          $scope.items=$scope.shops=shops;
          $scope.addresses=$scope.shopsAddress(shops);
          resolve(shops);
        });
        return deferred.promise;
      } 

      filter={sort:'categories.weight',group:'categories.name', status:true, home:true, available:true};
      $scope.products=product.home(null,filter,function(products){
        $scope.items=$scope.products=products;
        resolve(products);
      });
      return deferred.promise;
    };

    $scope.loadNextPage=function(){
      var promise=$q.when(true);
      if(!$scope.items){
       promise=$scope.loadHome();
      } 
      promise.then(function(){
        var i=0;
        Object.keys($scope.items).every(function(key,i){
          if($scope.items[key].length && !$scope.items[key].loaded){
            $scope.items[key].loaded=true;
            $scope.infinite[key]=$scope.items[key];
            return (i++<1);
          }
          return true;
        });

      });
    };
        
  }
]);

  
 
})(window.angular);
