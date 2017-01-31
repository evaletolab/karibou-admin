;(function(angular) {'use strict';


//
// Define the application level controllers
angular.module('app.root', ['app.config','app.user'])
  .controller('AppCtrl',appCtrl);

//
// the AppCtrl is used in index.html (see app/assets/index.html)
appCtrl.$inject=[
  '$scope','$rootScope','$window','$location','$routeParams','$timeout','$http','$translate','config','api','user','cart','category','shop'
  ];
function appCtrl($scope, $rootScope, $window,  $location, $routeParams, $timeout, $http, $translate, config, api, user, cart, category,shop) {

  $rootScope.user=$scope.user = user;
  $scope.cart = cart;
  $scope.categories = [];
  $scope.config=config;
  $scope.api=api;
  $scope.cover=config.cover;        
  $scope.browserName;
  window.referrers=[];
  $scope.daysweek="dim._lun._mar._mer._jeu._ven._sam.".split('_');
  $scope.daysweekLg="dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi".split('_');

  var options=$scope.options={
    isAdmin:false,
    isShopOwner:false,
    isLogistic:false,
    cart:false,
    sidebar:false,
    wellSubscribed:false,
    needReload:false,
    displayShop:false,
    currentCategory:'',
    locale:$translate.use(),
    sidebarToggle:{
      left:false,
      right:false
    }
  };





  $scope.locale=function () {
    return options.locale;
  };

  $scope.changeLanguage = function (langKey) {
    $translate.use(langKey);
    options.locale=langKey;
    // update server
    $http.get(config.API_SERVER+'/v1/config?lang='+langKey);    
  };  



  //
  // export shops context for all Ctrl
  $rootScope.shops=$scope.shops=$scope.shopsSelect=shop.query({});




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

  $rootScope.$on('user.init',function() {
    options.isAdmin=user.isAdmin();
    options.isAuthenticated=user.isAuthenticated();
    options.isShopOwner=(user.shops.length||user.isAdmin());
    options.isLogistic=(user.hasRole('logistic')||user.isAdmin());
    user.isAuthenticated()&&$window.ga&&$window.ga('set', '&uid', user.id);
  })


  //
  // get categories
  $scope.loadCategory=function() {
    category.select({stats:true},function(categories){
      $scope.category=category;
    });
  }

  $scope.loadCategory();
  
  $scope.go=function(url) {
    return $location.path(url)
  }

  $scope.goBack=function(url) {
    if(!$window.history.length){
      return $location.path(url)
    }
    $window.history.back();
  }

  //
  // on Search 
  $scope.onSearch=function(){
    var search=$('#search-nav').val();
    $location.path('/search').search({q:search});
  };


  //
  // clear cache
  $rootScope.$on('$viewContentLoaded', function() {
    var path=$location.path();
    user.$promise.finally(function(){
      if($window.ga && 
         config.API_SERVER.indexOf('karibou.ch')!==-1 &&
         '/admin /login'.indexOf(path.substring(0,5))==-1){
        if(!user.isAdmin()){
          $window.ga('send', 'pageview', { page: path });
          if(fbq)fbq('track', "PageView");
        }        
      }

      //
      // manage admin
      if(user.isAdmin())
        angular.element('html').addClass('app-admin');
      else
        angular.element('html').removeClass('app-admin');

    });

    //
    // manage shop layout
    if($routeParams.shop)
      angular.element('html').addClass('app-shop');
    else
      angular.element('html').removeClass('app-shop');


    angular.element('html').removeClass('app-cart');
    options.sidebarToggle.left=false;
    options.sidebarToggle.right=false;
    
  });

  //
  // get the head title up2date 
  $rootScope.$on('$routeChangeStart', function (event, current, previous) {
    options.cart=false;
    options.sidebar=false;
    var longpath=$location.path();
    user.$promise.finally(function(){
      if (!user.isAuthenticated()){
        if(_.find(config.loginPath,function(path){
          return (longpath.indexOf(path)!==-1);
        })){
          $location.path('/login');
        }
      }

      var title="Karibou.ch Genève - le bon goût du marché en ligne";
      $rootScope.title = (current.$$route.title)?current.$$route.title:title;

    });

    options.currentCategory='';
    if(current.params.category){
      options.currentCategory=category.findNameBySlug(current.params.category);
    }

  });

  //
  // watch current config
  // $scope.$watch('config.shop', function(shared,old) {
  // },true);



  // Uses the url to determine if the selected
  // menu item should have the class active.
  $rootScope.$watch(function(){return $location.url();}, function (path, old) {
    $scope.activeNavId = path || '/';

    //
    // save the referer FIXME path or url??
    window.referrer=$rootScope.referrer=(path!== old)?old:undefined;
    if(window.referrer){
      window.referrers.push(window.referrer);
      if(window.referrers.length>2){
        window.referrers.shift();
      }
    }
  });

  $scope.showShopWidgets=function () {
    var currentPath=$location.path();
  
    //
    // if referer is in protected path?
    if(_.find(config.avoidShopUIIn,function(path){
        return (currentPath.indexOf(path)!==-1);})){
      return false;
    }
    return true;
  };



  //
  // welcome click 
  $scope.onWelcome=function () {
    // TODO use of localstorage to replace cookie5
    // avoid lander page on email validation
    // options.welcome=$cookies.welcome=true;
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

    // TODO FIX ISSUE WITH NG AND COOKIES
    //$cookies[subject]=true;

    $http.post(config.API_SERVER+'/v1/message/aHR0cDovL2thcmlib3UuZXZhbGV0b2xhYi5jaA==/'+subject, content).
      success(function(data, status, headers, config) {
        api.info($scope,"Votre requête a bien été envoyée! ");        
        user.mailchimp=true;
      });
    
  };


  //
  // browser detection    
  $scope.browser=function() {
    if($scope.browserName){
      return $scope.browserName;
    }
    var userAgent = $window.navigator.userAgent;
    var browsers = {chrome: /chrome/i, safari: /safari/i, firefox: /firefox/i, ie: /internet explorer/i};
    for(var key in browsers) {
      if (browsers[key].test(userAgent)) {
        return $scope.browserName=key;
      }
    }
    // special case for IE>=11
    if((new RegExp("Trident/.*rv:([0-9]{1,}[\.0-9]{0,})").exec(navigator.userAgent))&&(navigator.appName == 'Netscape')){
      return 'ie';
    }
  };




  $rootScope.locationReferrer=function(defaultUrl){
    $location.path($rootScope.referrer?$rootScope.referrer:defaultUrl);
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
  


  $scope.toggleCart=function(sel){
    options.cart=!options.cart;
    angular.element('html').toggleClass('app-cart');
  };
  


  $rootScope.uploadImageError=function(error){
      //http://ucarecdn.com/c1fab648-f6b7-4623-8070-798165df5ca6/-/resize/300x/
      if(error){
        $timeout(function () {
          api.info($rootScope,error);
        });
      }

  };

}

})(window.angular);