;(function(angular) {'use strict';


//
// Define the application level controllers
angular.module('app.root', ['app.config','app.user'])
  .controller('AppCtrl',appCtrl);

//
// the AppCtrl is used in index.html (see app/assets/index.html)
appCtrl.$inject=['$scope','$rootScope','$window','$location','$cookies','$routeParams','$timeout','$http','config','api','user','cart','category','product'];
function appCtrl($scope, $rootScope, $window,  $location, $cookies, $routeParams, $timeout, $http, config, api, user, cart, category, product) {

  $rootScope.user=$scope.user = user;
  $scope.cart = cart;
  $scope.categories = [];
  $scope.config=config;
  $scope.cover=config.cover;        



  $scope.options={
    cart:false,
    sidebar:false,
    wellSubscribed:false,
    needReload:false,
    welcome:($cookies.welcome||true)
  };

  //
  // welcome page
  // (function() {
  //   var path=$location.path();
  //   if(path.indexOf('/validate/')===0 ||path.indexOf('/page/')===0 ||$cookies.welcome) {      
  //     return;
  //   }

  //   $location.path('/welcome')
  // })()


  //
  // check and init the session    
  user.me(function(u){
    $scope.user = u;
  });

  //
  // after N days without reloading the page, 
  $timeout(function () {
    $scope.options.needReload=true;
  },86400000*2);
  
  //
  // get categories
  category.select({stats:true},function(categories){
    $scope.category=category;
  });


  //
  // clear cache
  $rootScope.$on('$viewContentLoaded', function() {
    if($window.ga && config.API_SERVER.indexOf('localhost')==-1 && config.API_SERVER.indexOf('evaletolab')==-1){
      if(!user||(user && !user.isAdmin()))
      {$window.ga('send', 'pageview', { page: $location.path() });}        
    }
  });

  //
  // get the head title up2date 
  $rootScope.$on('$routeChangeStart', function (event, current, previous) {
    $scope.options.cart=false;
    $scope.options.sidebar=false;
    var longpath=$location.path();
    user.$promise.finally(function(){
      if (!user.isAuthenticated()){
        if(_.find(config.loginPath,function(path){
          return (longpath.indexOf(path)!==-1);
        })){
          $location.path('/login');
        }
      }

      var title="Karibou Genève - un marché alimentaire composé d'artisans, de producteurs et de petits commerçants";
      $rootScope.title = (current.$$route.title)?current.$$route.title:title;

    });
  });



  // Uses the url to determine if the selected
  // menu item should have the class active.
  $rootScope.$watch(function(){return $location.path();}, function (path, old) {
    $scope.activeNavId = path || '/';

    //
    // save the referer FIXME path or url??
    window.referrer=$rootScope.referrer=(path!== old)?old:undefined;
  });

  //
  // welcome click 
  $scope.onWelcome=function () {
    // TODO use of localstorage to replace cookie5
    // avoid lander page on email validation
    // $scope.options.welcome=$cookies.welcome=true;
    // var localStorage=$window['localStorage'];
    // $location.path('/')
    $scope.locationReferrer('/');
  };

  $scope.subscribe=function (user, subject) {
    var content={
      fname:user.name.givenName,
      lname:user.name.familyName,
      email:user.email.address
    };
    if(!subject){
      return api.info($scope,"Hoho, vous devez préciser votre code postal ;)");        
    }

    $http.post(config.API_SERVER+'/v1/message/aHR0cDovL2thcmlib3UuZXZhbGV0b2xhYi5jaA==/'+subject, content).
      success(function(data, status, headers, config) {
        api.info($scope,"Votre requête a bien été envoyée! ");        
        user.mailchimp=true;
      });
    
  };


  //
  // browser detection    
  $scope.browser=function() {
    var userAgent = $window.navigator.userAgent;
    var browsers = {chrome: /chrome/i, safari: /safari/i, firefox: /firefox/i, ie: /internet explorer/i};
    for(var key in browsers) {
      if (browsers[key].test(userAgent)) {
        return key;
      }
    }
    // special case for IE>=11
    if((new RegExp("Trident/.*rv:([0-9]{1,}[\.0-9]{0,})").exec(navigator.userAgent))&&(navigator.appName == 'Netscape')){
      return 'ie';
    }
  };


  //
  // this is an helper for avoid the default sorting by ng-repeat
  $scope.keys=function(map){
    if(!map){return [];}
    return Object.keys(map);
  };


  $rootScope.locationReferrer=function(defaultUrl){
    $location.path($rootScope.referrer?$rootScope.referrer:defaultUrl);
  };



  $rootScope.showMenuOnSwipe=function(){
    //$('nav.site-nav').click();
  };

  $rootScope.hideMenuOnSwipe=function(){
    //$('nav.site-nav').click();
  };




  $scope.toggle = function (params,clear) {
    if(clear){
      $location.search({});
    }
    angular.forEach(params, function (v, k) {
        var t = ($location.search()[k] && $location.search()[k] === v) ? null : v;
        $location.search(k, t);
    });
  };

  $scope.getToggleClass=function(key,value, clazz){
    if(!clazz){clazz='active';}
    // for '/'
    if(!key) {
      return (Object.keys($routeParams).length===0)?clazz:'';
    }

    // search options
    return ($routeParams[key]==value)?clazz:'';
  };

  // getClass compares the current url with the id.
  // If the current url starts with the id it returns 'active'
  // otherwise it will return '' an empty string. E.g.
  //
  //  // current url is '/products/1'
  //  getClass('/products'); // returns 'active'
  $scope.getClass = function (id, or) {
    if (!$scope.activeNavId){return '';}
    if ($scope.activeNavId.substring(0, id.length) === id) {
      return 'active';
    }
    if (or && $scope.activeNavId.substring(0, or.length) === or) {
      return 'active';
    }
    return '';
  };
 


  $scope.getCover=function(){
    $scope.cover=config.cover;        
    var template='/partials/cover.html';


    if ($routeParams.category){
       var c=category.findBySlug($routeParams.category);
       if(c&&c.cover) {$scope.cover=c.cover;}
       template='/partials/product/cover.html';
    }

    if(user.isAuthenticated())
      template='/partials/account/cover.html';


    return template;
  };

  $scope.showOverview=function(){
    $location.path('/account/overview');
  };

  $scope.showOrder=function(){
    $location.path('/account/orders');

  };

  $scope.showLove=function(){
    $location.path('/account/love');
  };

  //
  // logout (global function)
  $scope.logout=function(){
    user.logout(function(user){
      $location.url('/');
    });
  };

  //
  // validate user email
  $scope.verify=function(user){
    $rootScope.WaitText="Waiting ...";
    user.validateEmail(function(validate){
      api.info($scope,"Merci, une confirmation a été envoyée à votre adresse email");
      if (!user.isAuthenticated())
        {$location.url('/');}
    });
  };
  
  //
  // the size of shop and product cart
  $scope.getFormat=function(index){      
    if (index===undefined) {return 'c2';}
    return (!index)?"c3":"c2";
  } ;   


  $scope.toggleCart=function(sel){
    $scope.options.cart=!$scope.options.cart;
  };
  

  $scope.addCart=function (item) {
    cart.add(item, true);    
  };

  $scope.removeCart=function (item) {
    cart.remove(item, true);
  };

}

})(window.angular);