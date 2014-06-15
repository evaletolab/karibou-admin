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
  '$q',
  'config',
function ($rootScope, $http, $resource, $timeout, $q, config) {  
  var _categories=[], promise;

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
      $timeout.cancel(promise);
      promise=$timeout(function(){
        $rootScope.FormInfos=false;
        if (cb) cb($scope);
        promise=false;
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
  
  
  function wrapDomain(clazz, key, defaultClazz){

    clazz.prototype.copy = function(data) {
        angular.extend(this,defaultClazz, data);
    };

    //
    // default behavior on error
    clazz.prototype.onerr=function(data,config){
      this.copy(defaultClazz);
    };

    /**
     * chain a Object resource as the next promise
     */
    clazz.prototype.chain=function(promise){
     var self=this
     this.$promise=this.$promise.then(function(){
         return promise
     })
     return this
    }


    /**
     * chain a Array resource as the next promise
     */
    clazz.prototype.chainAll=function(promise){
     var self=this;var deferred=$q.defer(); var lst=new Array()
     this.$promise=lst.$promise=this.$promise.then(function(){
          return promise.then(function(l){
            lst=self.wrapArray(l)
            // deferred.resolve(lst)
            return lst
          })
     })
     // this.$promise=lst.$promise=deferred.promise;
     return lst
    }

    /**
     * wrap json data to Object instance repository
     */
    clazz.prototype.wrapArray=function(values){
      var list=[];
      values.forEach(function(instance){
        //
        // manage cache on multiple instance
        if(!_all[instance[key]]){
          _all[instance[key]]=new clazz();          
        }
        _all[instance[key]].copy(instance);
        list.push(_all[instance[key]]);
      });
      return list;  
    };
    
   
    clazz.prototype.wrap=function(instance){
      this.copy(instance);
      return this;
    }


    
    /**
     * find data in repository 
     */
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
      var list=_singleton.wrapArray(elems);
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
  




