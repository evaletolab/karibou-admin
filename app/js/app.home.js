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
    $scope.groupByShop={};
    $scope.filterForHome={type:'Category',home:true,active:true};

    $rootScope.$on('user.init',function() {
      if(user.isAuthenticated()){
        delete $scope.filterForHome.home;
      }else{
        $scope.filterForHome.home=true;
      }
    });

    // $scope.shops.$promise.then(function () {
    //   // body...
    // })

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



    $scope.loadHome=function(options){
      var deferred = $q.defer(),now=Date.now();
      options=options||{};

      //
      // list products by category
      if ($routeParams.category){
        category.findNameBySlug($routeParams.category);
        $scope.$parent.title="Les produits - "+$scope.group;
        filter={sort:'title',status:true,available:true};
        $scope.groupByShop={};
        product.findByCategory($routeParams.category,filter,function(products){
          $scope.items=_.sortBy(products,function (p) {
            return p.vendor.urlpath+(now-p.updated.getTime());
          });
          $scope.items.forEach(function(prod) {
            if(!$scope.groupByShop[prod.vendor.urlpath]){
              $scope.groupByShop[prod.vendor.urlpath]={
                name:prod.vendor.name,
                photo:prod.vendor.photo.owner,
                count:0
              };
            }
            $scope.groupByShop[prod.vendor.urlpath].count++;
          });

          deferred.resolve(products);
        });
        return deferred.promise;
      }
      
      //
      // load my popular & love products
      if(options.love){
        product.findLove({popular:true,windowtime:2, available:true,maxcat:8},function(products){
          $scope.items=_.sortBy(products,function (p) {
            return p.categories.weight;
          });
          deferred.resolve(products);
        });
        return deferred.promise;        
      }
      
      //
      // get shops for the front page
      if(options.shops){
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
        $scope.items=_.sortBy(products,function (p) {
          return p.categories.weight;
        });
        deferred.resolve(products);
      });
      return deferred.promise;
    };



    $scope.getProductsByShop=function(slug) {
      var arr=$scope.infinite.filter(function(prod) {
        if(prod.vendor.urlpath===slug) return prod;
      });

      return arr;
    }


    $scope.getProductsByCat=function(name) {
      var arr=$scope.infinite.filter(function(prod) {
        if(prod.categories.name===name) return prod;
      });

      return arr;
    }

    $scope.loadNextPage=function(opts){
      if($scope.scrollBusy) return;
      if(!promise){
       promise=$scope.loadHome(opts);
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
