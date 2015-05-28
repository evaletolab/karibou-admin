;(function(angular) {'use strict';

//
// Define the application global configuration
angular.module('app.config', [])
  .factory('config', appConfig)
  .controller('ConfigCtrl',ConfigCtrl);


//
// implement service
appConfig.$inject=['$q','$resource','$sce','API_SERVER']; 
function appConfig($q, $resource, $sce, API_SERVER) {
  var deferred = $q.defer();
  
  var defaultConfig = {
    API_SERVER:API_SERVER,
    
    API_VERSION: '/v1',

    LOG_LEVEL: 'debug',
    
    AUTH_SUCCESS_REDIRECT_URL:'/',
    AUTH_ERROR_REDIRECT_URL:'/login',

    filepicker:"At5GnUxymT4WKHOWpTg5iz",
    // storage:"//karibou-filepicker.s3-website-eu-west-1.amazonaws.com/",
    storage:"//s3-eu-west-1.amazonaws.com/karibou-filepicker/",

    uploadcare:'b51a13e6bd44bf76e263',

    staticMapKey:"AIzaSyD5w46BmWX6hX-uJ2yMycS_cRb2HRvDXQU",

    disqus:'7e23b8cfd1ba48cdb5a3487efcbcdc56', /*karibou dev*/ 
    // disqus:'a0602093a94647cd948e95fadb9b9e38', /*karibou prod*/

    github:{
        repo:'evaletolab/karibou-doc',
        token:'7b24b8ec909903ad91d4548fc6025badaf1501bc'      
    },
    
    cover:'img/localfood.jpg',
    // cover:'img/home-site.jpg',
    
    postfinance:{
      url:$sce.trustAsResourceUrl('https://e-payment.postfinance.ch/ncol/test/orderstandard_utf8.asp')
    },

    user:{
      photo:'//placehold.it/80x80'
    },
    shop:{
      photo:{
        fg:"//placehold.it/400x300",
        owner:"//placehold.it/80x80&text=owner",
        bg:''
      }
    },
    loginPath:['/admin','/account'],
    avoidFeedbackIn:['/admin','/login','/signup']
  };
  defaultConfig.ACCEPT_COOKIE=defaultConfig.API_SERVER+'/acceptcookie';

  defaultConfig.providers = [
    {name: 'twitter',   url: defaultConfig.API_SERVER + '/auth/twitter'},
    {name: 'google+',   url: defaultConfig.API_SERVER + '/auth/google'},
    {name: 'persona',   url: defaultConfig.API_SERVER + '/auth/browserid'},
  ];

  defaultConfig.otherproviders = [
    {name: 'google+',   url: defaultConfig.API_SERVER + '/auth/google'},
    {name: 'facebook',  url: defaultConfig.API_SERVER + '/auth/facebook'},
    {name: 'linkedin',  url: defaultConfig.API_SERVER + '/auth/linkedin'},
    {name: 'github',    url: defaultConfig.API_SERVER + '/auth/github'}
  ];

  
  //
  // get server side config
  defaultConfig.shop=deferred.promise;
  var serverSettings=$resource(defaultConfig.API_SERVER+'/v1/config').get(function(){
      angular.extend(defaultConfig.shop,serverSettings);


      deferred.resolve(defaultConfig);
  });

  return defaultConfig;
}


//
// implement config controller
ConfigCtrl.$inject=['$scope','$resource','config','api'];
function ConfigCtrl($scope,$resource,config,api){
  var $dao=$resource(config.API_SERVER+'/v1/config');
  $scope.config=config;

  //
  // save stored config (admin only)
  $scope.saveConfig=function(){
    $dao.save(config.shop,function(){
      api.info($scope,"Configuration sauvée");
    });
  };

}

})(window.angular);
