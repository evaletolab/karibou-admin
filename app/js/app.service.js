'use strict';


var Service=angular.module('app.api',['app.config']);

// Declare global filters here, 
// Placehold will replace null img by default one from placehold.it 
// Example , with img is Null {{img|plahold:'80x80'}} => http://placehold.it/80x80 
Service.filter("placehold",function(){
  return function(img,params){
    if (img)return img;
    return "http://placehold.it/"+params;
  }
});

Service.filter("categories",function(){
  return function(categories,type){
    if (!categories || type==='*')return categories;
    var t=(type)?type:'Category';
    return _.filter(categories,function(c){c.type===t});
  }
});

Service.filter('test', function () {
   return function(input, trueValue, falseValue) {
        return input ? trueValue+input : falseValue;
   };
});


//
// Declare global directives here
Service.directive('ngFocus', ['$parse', function($parse) {
  return function(scope, element, attr) {
    var fn = $parse(attr['ngFocus']);
    element.bind('focus', function(event) {
      scope.$apply(function() {
        fn(scope, {$event:event});
      });
    });
  }
}]);
 
Service.directive('ngBlur', ['$parse', function($parse) {
  return function(scope, element, attr) {
    var fn = $parse(attr['ngBlur']);
    element.bind('blur', function(event) {
      scope.$apply(function() {
        fn(scope, {$event:event});
      });
    });
  }
}]);

Service.directive('backstretch', ['$parse', function($parse) {
  return function(scope, element, attr) {
      console.log("app.service:backstretch", element, attr['backstretch'])
      $(element).backstretch(attr['backstretch']);
  }
}]);

Service.directive('backfader', ['$parse','$location', function($parse,$location) {
  return function(scope, element, attr) {
      console.log("app.service:backfader", element, attr['backfader'])
      element.removeClass('hide').addClass('noscroll').click(function(e) {
		    if(e.target === element[0]){
	       	//element.hide();
		      //$('#popup').hide();
          //$("body").removeClass('noscroll');
          var url=$location.path().replace(/^(.*)\/[0-9]+$/,"$1");
          scope.$apply(function(){
            $location.path(url)
          });
          return;
        }
        
        //element.show();
		  });	    
  }
}]);



Service.directive('fadeOnHover', ['$parse', function($parse) {
  return function(scope, element, attr) {
      var e=angular.element(attr['fadeOnHover']);
      e.bind('mouseenter', function(){
        console.log("hello out")
        element.fadeOut('fast');
      }).bind('mouseleave', function(){
        console.log("hello in")
        element.fadeIn('fast');
      })
            
      element.hide();
  }
}]);




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
      if(ms === undefined){
        var ms=4000;
      }
      else if ((typeof ms)==='function'){
        var cb=ms;ms=4000;
      }
      $scope.FormInfos=msg;
      $timeout(function(){
        $scope.FormInfos=false;
        if (cb) cb($scope);
      }, ms);
  };
  
  function error($scope){
    return function (err, status, thrown){
      var e;
      if (!err) e="Undefined error!";
      if (err.responseText) e=err.responseText;
      if (err.data) e=err.data;
      if (!e)e=err;
      var msg=parseError(e);
      $scope.FormErrors=e;
      $timeout(function(){
        $scope.FormErrors=false;
      }, 6000);
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
  
  function uploadfile(options, callback){
    filepicker.pick({
        mimetypes: ['image/*'],
        maxSize: 150*1024,
        services:['COMPUTER', 'FACEBOOK', 'GMAIL', 'INSTAGRAM'],
      },
      function(FPFile){
        //https://www.filepicker.io/api/file/PMaxCDthQd2buSL4lcym
        callback(null,FPFile);
      },
      function(FPError){
        callback(FPError);
      }
    );
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
      if (copy)this.copy(_all[instance[key]]);
      return _all[instance[key]];
    }
    
    clazz.findAll=function(where){
      if (!where) return _.map(_all, function(val,key){return val;});
      return _.where(_all,where);
    }

    clazz.find=function(where){
      if (!where) return _singleton;
      return _.findWhere(_all,where);
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
  




