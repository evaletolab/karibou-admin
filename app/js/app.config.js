'use strict';

//
// Define the application global configuration
angular.module('app.config', []).factory('config', [
  '$resource',
  function ($resource) {
    // karibou-api.cloudfoundry.com
    // localhost:4000\:4000

    
    var defaultConfig = {
      //API_SERVER: 'http://localhost:4000\:4000',
      API_SERVER: 'http://karibou-api.cloudfoundry.com',
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

      providers : [
        {name: 'twitter',   url: 'http://karibou-api.cloudfoundry.com' + '/auth/twitter'}
      ],
      otherproviders : [
        {name: 'google+',   url: this.API_SERVER + '/auth/google'},
        {name: 'facebook',  url: 'http://localhost:4000' + '/auth/facebook'},
        {name: 'linkedin',  url: this.API_SERVER + '/auth/linkedin'},
        {name: 'github',    url: this.API_SERVER + '/auth/github'}
      ]

    };
    
    //
    // get server side config
    var serverSettings=$resource(defaultConfig.API_SERVER+'/v1/config').get(function(){
        angular.extend(defaultConfig.shop,serverSettings);
    });


    return defaultConfig;
  }
]);
  
