;(function(angular) {'use strict';

//
// Define the application global configuration
angular.module('app.config', []).factory('config', [
  '$q',
  '$resource',
  'API_SERVER',
  function ($q, $resource, API_SERVER) {
    var deferred = $q.defer();
    
    var defaultConfig = {
      API_SERVER:API_SERVER,
      
      API_VERSION: '/v1',

      LOG_LEVEL: 'debug',
      
      AUTH_SUCCESS_REDIRECT_URL:'/',
      AUTH_ERROR_REDIRECT_URL:'/login',

      storage:"http://karibou-filepicker.s3-website-eu-west-1.amazonaws.com/",

      user:{
        photo:'http://placehold.it/80x80'
      },
      shop:{
        photo:{
          fg:"http://placehold.it/400x300",
          owner:"http://placehold.it/80x80&text=owner",
          bg:''
        }
      },
      loginPath:['/admin','/account']
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
        deferred.resolve(defaultConfig)
    });

    return defaultConfig;
  }
]);
  
})(window.angular);
