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
    var filter={sort:'created'}, promise,scrollBusy=false, nextShipping;
    $scope.user = user;
    $scope.map=new Map();
    $scope.items=[];
    $scope.infinite=[];
    $scope.product=false;
    $scope.groupByShop={};
    $scope.filterForHome={type:'Category',home:true,active:true};


    $rootScope.$on("shipping.update",function(event,date) {
      nextShipping=date;
      $scope.infinite=[]
      $scope.items=[];promise=false;
      $scope.loadNextPage();
    });

    $rootScope.$on('user.init',function() {
      if(user.isAuthenticated()){
        delete $scope.filterForHome.home;
      }else{
        $scope.filterForHome.home=true;
      }
    });

    config.shop.then(function(){
      nextShipping=config.shop.shippingweek[0];
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
      // sort api
      function sort_by_cat_and_date(a,b) {
        if(a.vendor.urlpath<b.vendor.urlpath) return -1;
        if(a.vendor.urlpath>b.vendor.urlpath) return 1;
        return a.updated.getTime() - b.updated.getTime();
      }

      function sort_by_weigth_and_date(a,b) {
        if(a.categories.weight<b.categories.weight) return -1;
        if(a.categories.weight>b.categories.weight) return 1;
        return a.updated.getTime() - b.updated.getTime();
      }


      //
      // list products by category
      if ($routeParams.category){
        category.findNameBySlug($routeParams.category);
        $scope.$parent.title="Les produits - "+$scope.group;
        filter={sort:'title',status:true,available:true};
        $scope.groupByShop={};
        product.findByCategory($routeParams.category,filter,function(products){
          $scope.items=products.sort(sort_by_cat_and_date);
          // REMOVE THIS IS NO MORE USED in home.html
          // $scope.items.forEach(function(prod) {
          //   if(!$scope.groupByShop[prod.vendor.urlpath]){
          //     $scope.groupByShop[prod.vendor.urlpath]={
          //       name:prod.vendor.name,
          //       urlpath:prod.vendor.urlpath,
          //       photo:prod.vendor.photo.owner,
          //       count:0
          //     };
          //   }
          //   $scope.groupByShop[prod.vendor.urlpath].count++;
          // });

          deferred.resolve(products);
        });
        return deferred.promise;
      }
      
      //
      // load my popular & love products
      if(options.love){
        product.findLove({popular:true,windowtime:2, available:true,maxcat:8},function(products){
          $scope.items=products.sort(sort_by_weigth_and_date);
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
      filter={
        popular:true, 
        status:true, 
        home:true, 
        discount:true, 
        available:true,
        maxcat:4,
        when:nextShipping
      };
      product.query(filter,function(products){
        $scope.items=products.sort(sort_by_weigth_and_date);
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

    $scope.getAvailableCategories=function() {
      var lst=[];
      $scope.infinite.forEach(function(p) {
        if(!_.find(lst,function (c) {return(c&&c.name===p.categories.name);}))
          lst.push(category.find({name:p.categories.name}));
      });

      return lst;
    }

    $scope.getAvailableShop=function() {
      var lst=[];
      $scope.groupByShop
      $scope.infinite.forEach(function(p) {
        if(!_.find(lst,function (vendor) {return(vendor.urlpath===p.vendor.urlpath);}))
          lst.push(p.vendor);
      });
      return lst;
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
