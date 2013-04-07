'use strict';


angular.module('app.api',['app.config']).factory('api', [
  '$rootScope',
  '$http',
  '$resource',
  'config',
function ($rootScope, $http, $resource, $httpProvider, config) {
/**
  $.ajaxSetup({
    dataType:"json",
    crossDomain:true,
    xhrFields:{
      withCredentials:true
    }
  });  
  function qget(method,options){
        return $.ajax({type:"GET", url:config.API_SERVER+method,data:options});
  };
  
  function qpost(method,options){
        return $.ajax({type:"POST", url:config.API_SERVER+method,data:options});
  };
  
  function qupdate(method,options){
        return $.ajax({type:"PUT", url:config.API_SERVER+method,data:options});
  };

  function qdelete(method,options){
        return $.ajax({type:"DELETE", url:config.API_SERVER+method,data:options});
  };
*/

  function get(method,options){
        return $http({method:"GET", url:config.API_SERVER+method,data:options});
  };

  function post(method,options){
        return $http({method:"POST", url:config.API_SERVER+method,data:options});
  };
  
  function update(method,options){
        return $http({method:"PUT", url:config.API_SERVER+method,data:options});
  };
  
  function me(){
      return get('/v1/users/me',{});
  }
  
  function error($scope){
    return function (err, status, thrown){
      var e;
      if (!err){
        $scope.FormErrors="Undefined error!";
        return;  
      }
      if (err.responseText) e=err.responseText;
      if (err.data) e=err.data;
      var msg=parseError(e);
      $scope.FormErrors=msg;
    }
  };  
  
  function parseError(err){
      if(typeof err === 'string' || typeof err.responseText === 'string')
        return err;
        
      if (err.responseText){
        try{
          return JSON.parse(err.responseText).error;
        }catch(e){}
        return err.responseText
      }
      return err;
  };
  return {
    error:error
  };
  


  
}]);
  




