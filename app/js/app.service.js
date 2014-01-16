'use strict';


var Service=angular.module('app.api',['app.config']);


Service.factory("flash", function($rootScope) {
  var queue = [], currentMessage = '';
  
  $rootScope.$on('$routeChangeSuccess', function() {
    if (queue.length > 0) 
      currentMessage = queue.shift();
    else
      currentMessage = '';
  });
  
  return {
    set: function(message) {
      queue.push(message);
    },
    get: function(message) {
      return currentMessage;
    }
  };
});


Service.factory('api', [
  '$rootScope',
  '$http',
  '$resource',
  '$timeout',
  'config',
function ($rootScope, $http, $resource, $timeout, config) {  
  var _categories=[];

  /**
   * get category object
   */
  function findBySlug(slug){
    var cats=_categories;
    for (var i in cats){
      if(cats[i].slug===slug)return cats[i].name;
    }
    return "Inconnu";
  };

  function info($scope, msg, ms, cb){
      if(ms === undefined){ var ms=6000; }
      else if ((typeof ms)==='function'){ var cb=ms;ms=6000; }
      $rootScope.FormInfos=msg;
      $timeout(function(){
        $rootScope.FormInfos=false;
        if (cb) cb($scope);
      }, ms);
  };

  
  
  function parseError(err){
      if(typeof err === 'string') 
        return err;
      if(typeof err.responseText === 'string')
        return err.responseText;
      if(typeof err.data === 'string')
        return err.data;       
      console.log(err)
      if(err.data.length){
        var msg=""
        err.data.forEach(function(e){
          msg=msg+"<p>"+e+"</p>";
        })
        return msg;
      }         
      return "Undefined error!";
  };

  function error($scope, ms, cb){
    if(ms === undefined){ var ms=6000; }
    else if ((typeof ms)==='function'){ var cb=ms;ms=6000; }
    return function (err, status, thrown){
      var e=parseError(err);
      $rootScope.FormErrors=e;
      $timeout(function(){
        $rootScope.FormErrors=false;
        if (cb) cb($scope);
      }, ms);
    }
  };  
  
  
  function uploadfile($scope, options, callback){
    //
    // load filepicker and set api key
    $script("//api.filepicker.io/v1/filepicker.js",function(){
      console.log("load fp")
      filepicker.setKey("At5GnUxymT4WKHOWpTg5iz");

      filepicker.pick({
          mimetypes: ['image/*'],
          maxSize: 150*1024,
          services:['COMPUTER', 'FACEBOOK', 'GMAIL', 'INSTAGRAM'],
        },
        function(FPFile){
          //https://www.filepicker.io/api/file/PMaxCDthQd2buSL4lcym
                 
          $scope.$apply(function () {
            filepicker.stat(FPFile, {width: true, height: true},
              function(metadata){              
                callback(null,FPFile,metadata, metadata.height/metadata.width);

            });        
          });
        },
        function(FPError){
          $scope.$apply(function () {
            callback(FPError);
          });
        }
      );

    })

    return false;      
  }
  
  
  function wrapDomain(clazz, key, rest, defaultclazz, onerr){

    clazz.prototype.copy = function(data) {
        angular.extend(this,defaultclazz, data);
    };


    clazz.prototype.map=function(values){
      var list=[];
      values.forEach(function(instance){
        list.push(_singleton.share(instance));
      });
      return list;  
    };
    
   
    clazz.prototype.share=function(instance, copy){
      if(!_all[instance[key]]){
        _all[instance[key]]=new clazz();
        _all[instance[key]].copy(instance);
      }
      if (copy)this.copy(instance);
      return _all[instance[key]];
    }
    
    clazz.findAll=function(where, cb){
      if (!where){
        return _.map(_all, function(val,key){return val;});
      }
      var lst=_.where(_all,where);
      if(cb)cb(lst)
      return lst;
    }

    clazz.prototype.findAll=function(where){ 
      return clazz.findAll(where);
    }

    clazz.prototype.find=function(where){ 
      return clazz.find(where);
    }

    clazz.find=function(where,cb){
      if (!where){ 
        return;
      }
      var lst;
      if ((typeof where) === "string"){
        lst=_all[where];
      }else{
        lst=_.findWhere(_all,where);
      }
      if(cb)cb(lst);      
      return lst;
    };
    
    clazz.load=function(elems){
      if (!elems) return _.map(_all, function(val,key){return val});
      var list=[];
      elems.forEach(function(e){
        list.push(_singleton.share(e));
      });
      return list;
    };
    //
    //default singleton for user 
    var     _singleton=new clazz({});
    var     _all={};
    return _singleton;  

  };
  return {
    uploadfile:uploadfile,
    wrapDomain:wrapDomain,
    findBySlug:findBySlug,
    error:error,
    info:info
  };
}]);
  




