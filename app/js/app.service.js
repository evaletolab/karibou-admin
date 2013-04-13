'use strict';


angular.module('app.api',['app.config']).factory('api', [
  '$rootScope',
  '$http',
  '$resource',
  '$timeout',
  'config',
function ($rootScope, $http, $resource, $timeout, config) {  
  function info($scope, msg){
      $scope.FormInfos=msg;
      $timeout(function(){
        $scope.FormInfos=false;
      }, 4000);
  };
  
  function error($scope){
    return function (err, status, thrown){
      var e;
      if (!err) e="Undefined error!";
      if (err.responseText) e=err.responseText;
      if (err.data) e=err.data;
      var msg=parseError(e);
      $scope.FormErrors=e;
      $timeout(function(){
        $scope.FormErrors=false;
      }, 4000);
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
    error:error,
    info:info
  };
  


  
}]);
  




