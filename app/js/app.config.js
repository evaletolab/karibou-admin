'use strict';

//
// Define the application global configuration
angular.module('app.config', []).factory('config', [
  '$q',
  '$resource',
  function ($q, $resource) {
    var deferred = $q.defer();
    
    var defaultConfig = {
      API_SERVER: 'http://localhost:4000',
      //API_SERVER: 'http://192.168.1.35:4000',
      //API_SERVER: 'http://karibou-api.cloudfoundry.com',
      //API_SERVER: 'http://karibou-evaletolab.rhcloud.com',
      //API_SERVER: 'http://karibou-api.jit.su',
      //API_SERVER:'http://karibou-api.eu01.aws.af.cm',
      // API_SERVER:'http://karibou-api.evaletolab.ch',
      API_VERSION: '/v1',

      LOG_LEVEL: 'debug',
      
      AUTH_SUCCESS_REDIRECT_URL:'/',
      AUTH_ERROR_REDIRECT_URL:'/login',

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
      loginPath:['/admin','/account','/order']
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
  
