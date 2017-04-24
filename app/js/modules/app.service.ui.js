;(function(angular) {'use strict';


var UI=angular.module('app.ui',['app.config']);

// Declare global filters here, 
// Placehold will replace null img by default one from placehold.it 
// Example , with img is Null {{img|plahold:'80x80'}} => http://placehold.it/80x80 
UI.filter("placehold",function(){
  return function(img,params){
    if (img)return img;
    return "//placehold.it/"+params;
  };
});


UI.filter('test', function () {
   return function(input, trueValue, falseValue) {
        return input ? trueValue+input : falseValue;
   };
});

UI.filter('cut', function () {
        return function (value, wordwise, max, tail) {
            if (!value) return '';

            max = parseInt(max, 10);
            if (!max) return value;
            if (value.length <= max) return value;

            value = value.substr(0, max);
            if (wordwise) {
                var lastspace = value.lastIndexOf(' ');
                if (lastspace != -1) {
                    value = value.substr(0, lastspace);
                }
            }

            return value + (tail || ' …');
        };
    });

UI.filter('clean', function () {
   return function(input) {
        if (!input) return "";
        return  input.replace(/[\.;-]/g, '');
   };
});





//
// ngRepeat filter from/to dates
UI.filter("betweenDates", function() {
  return function(items,field, from, to, isNull) {
        var df = (from)?new Date(from):new Date('1970');
        var dt = (to)?new Date(to):new Date('2080');
        var result = [];        
        for (var i=0; i<items.length; i++){
            var tf = new Date(items[i][field]),
                tt = new Date(items[i][field]);
            if (tf > df && tt < dt || (isNull&&!items[i][field]&&!from&&!to))  {
                result.push(items[i]);
            }
        }            
        return result;
  };
});

// this is native now
// http://stackoverflow.com/questions/19992090/angularjs-group-by-directive
// UI.filter('groupBy', ['$parse', function ($parse) {

UI.filter('dateMoment', function () {
   return function(date, prefix) {
        if (!date) {return "";}
        if (!prefix) {prefix="";}
        return  prefix+moment(date).format('ddd DD MMM YYYY', 'fr');
   };
});

UI.filter('dateMomentShort', function () {
   return function(date, prefix) {
        if (!date) {return "";}
        if (!prefix) {prefix="";}
        return  prefix+moment(date).format('ddd DD MMM', 'fr');
   };
});
  
UI.filter('dateMomentLong', function () {
   return function(date, prefix) {
        if (!date) {return "";}
        if (!prefix) {prefix="";}
        return  prefix+moment(date).format('dddd DD MMMM', 'fr');
   };
});

UI.filter('dateMomentHuman', function () {
   return function(date, prefix) {
        if (!date) {return "";}
        if (!prefix) {prefix="";}
        return  prefix+moment(date).fromNow();
   };
});

UI.filter('dateMomentDay', function () {
   return function(date) {
        if (!date) {return "";}
        var weekdays = "dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi".split("_");
        return  weekdays[date.getDay()];
   };
});



// =========================================================================
// MAINMENU COLLAPSE
// =========================================================================

UI.directive('toggleSidebar', function(){
    return {
        restrict: 'A',
        scope: {
            modelLeft: '=',
            modelRight: '='
        },
        link: function(scope, element, attr) {
            element.on('click', function(){
                if (element.data('target') === 'mainmenu') {
                    if (scope.modelLeft === false) {
                        scope.$apply(function(){
                            scope.modelLeft = true;
                        })
                    }
                    else {
                        scope.$apply(function(){
                            scope.modelLeft = false;
                        })
                    }
                }               
                if (element.data('target') === 'chat') {
                    if (scope.modelRight === false) {
                        scope.$apply(function(){
                            scope.modelRight = true;
                        })
                    }
                    else {
                        scope.$apply(function(){
                            scope.modelRight = false;
                        })
                    }
                    
                }
            })
        }
    }
});
    

    
// =========================================================================
// SUBMENU TOGGLE
// =========================================================================

UI.directive('toggleSubmenu', function(){
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            element.click(function(){
                element.next().slideToggle(200);
                element.parent().toggleClass('toggled');
            });
        }
    }
});


//
//
// input date format
UI.directive('formatDate', function ($window) {
    return {
        require:'^ngModel',
        restrict:'A',
        link:function (scope, elm, attrs, ctrl) {
            var moment = $window.moment;
            var dateFormat = attrs.formatDate;
            attrs.$observe('formatDate', function (newValue) {
                if (dateFormat == newValue || !ctrl.$modelValue) return;
                dateFormat = newValue;
                ctrl.$modelValue = new Date(ctrl.$setViewValue);
            });
            
            //
            // what you return here will be passed to the text field
            ctrl.$formatters.unshift(function (modelValue) {
                scope = scope;
                if (!dateFormat || !modelValue) return "";
                var retVal = moment(modelValue).format(dateFormat);
                return retVal;
            });

            // put the inverse logic, to transform formatted data into model data
            // what you return here, will be stored in the $scope            
            ctrl.$parsers.unshift(function (viewValue) {
                scope = scope;
                var date = moment(viewValue, dateFormat);
                return (date && date.isValid() && date.year() > 1950 ) ? date.toDate() : "";
            });
        }
    };
});

//
//
// dynamicaly set height (for autoscroll)
UI.directive('elementScroller', function() {
    return function (scope, element, attrs) {
        var header=attrs.elementScroller||0;
        var win=angular.element(window);
        element.height(win.height() - (header|0));
        win.bind('resize', function () {
          element.height(win.height() - (header|0));
        });

    }
});

//
//
// simple directive that block a button for a while to avoid multiple click
UI.directive('blockOnClick', [
    '$parse',
    '$timeout',
    function($parse,$timeout) {
    return function (scope, element, attrs) {
        var clazz=$parse(attrs.blockOnClick)()||{
          on:"fa-ellipsis-h",
          off:"fa-plus"
        };
        // get element
        var target=element.find(clazz.target||"i:first");
        target.addClass(clazz.off);
        element.click(function() {
          element.addClass("disabled");
          target.addClass(clazz.on);
          target.removeClass(clazz.off);
          $timeout(function() {
            target.addClass(clazz.off);
            target.removeClass(clazz.on);
            element.removeClass("disabled");
          },500);
        });

    }
}]);

//
//
// simple router to open map
UI.directive('mapScheme', ['$window','$parse','api',function($window,$parse,api) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      var uri,options, prefix="http://maps.google.com/?daddr=";
      element.on('click', function() {
        if(api.detect.iOS()){
          prefix="maps://maps.google.com/?daddr=";
        }
        else if(api.detect.Android()){
          prefix="geo:";
        }
        else if(api.detect.Windows()){
          prefix="maps:";
        }


        options=$parse(attrs.mapScheme)(scope);
        if(options.geo&&options.geo.lng&&options.geo.lat){
          uri=prefix+options.geo.lat+","+options.geo.lng;
          if(api.detect.Android()){
            uri+="?q="+options.geo.lat+","+options.geo.lng+"("+options.name+")";
          }
        }else{
          uri=prefix+options.streetAdress+","+options.postalCode+","+options.region;          
        }
        // iphone
        //http://maps.apple.com/?daddr=1600+Amphitheatre+Pkwy,+Mountain+View+CA
        //http://maps.google.com/?daddr=1+Infinite+Loop,+Cupertino+CA
        //http://maps.google.com/?daddr=lat,long
        // android
        //geo:0,0?q=my+street+address
        //geo:latitude,longitude?z=zoom
        // wp
        //maps:latitude,longitude?z=zoom
        // console.log(uri)
        $window.open(encodeURI(uri), '_system', 'location=no,fullscreen=yes,scrollbars=auto');
      });
    }
  };
}]);

//
// simple ngInclude
// http://zachsnow.com/#!/blog/2014/angularjs-faster-ng-include/
// scope http://stackoverflow.com/questions/14049480/what-are-the-nuances-of-scope-prototypal-prototypical-inheritance-in-angularjs
UI.directive('ngStaticInclude', [
  '$compile',
  '$templateCache',
  '$http',
  '$sce',
  function($compile, $templateCache, $http, $sce) {
    function includeTpl(element, template,scope){
      element.html(template);
      return $compile(element.contents())(scope);                
    }
    return {
      restrict: 'A',
      priority: 500,
      compile: function(element, attrs){
        var templateName = $sce.parseAsResourceUrl(attrs.ngStaticInclude)();
        return function(scope, element){
         $http.get(templateName, {cache: $templateCache}).then(function(response) {
           return includeTpl(element,response.data,scope);
         });
        };
      }
    };
  }
]);

//
// load image as background image
UI.directive("bgSrc", ['$timeout','config',function ($timeout,config) {
  return {
      restrict: 'A',
      link: function(scope, element, attrs){
        var url=attrs.bgSrc;//.replace(/ /g,'%20');

        if(attrs.bgSmall) {
          // url='http://cdn.filter.to/300x1000/'+url.replace('https','http')
          // url=config.API_SERVER+'/v1/cdn/image/305x1000?source='+url.replace('https','http')
          url+='-/resize/300x/';
        }else{
          url+='-/progressive/yes/';
        }
        element[ 0 ].style.backgroundImage = "url("+url+")";
      }
  };
}]);

//Send gg event {category:'',action:''}
UI.directive('gaSend', ['$parse','$window','config','user',function($parse,$window, config, user) {
  return function(scope, element, attr) {
    var o = $parse(attr.gaSend)();
    //
    // not always send gg analitycs
    if($window.ga && config.API_SERVER.indexOf('karibou.ch')!==-1 ){
      element.click(function(){
          if(user.isAdmin()){
            return;
          }
          $window.ga('send', 'event', o.category, o.action);        
          // if(console)console.log('ga',o)
      });
    }
  };
}]);

//
// reload page
UI.directive('reload', ['$parse','$timeout', function($parse, $timeout) {
  return function(scope, element, attr) {
    var path = attr.reload||'/';
    $timeout(function(){
        window.location.pathname = path;
    },5000);
  };
}]);






//
// Declare global directives here
UI.directive('confirmDelete', ['$parse', function($parse) {
  //
  // template
  var style="z-index:1;left:0;right:0;min-width: 350px;position: absolute;border: 2px solid red;padding: 10px;background-color: white;margin-top:-20px;display:none;left:25%;box-shadow:1px 1px 1000px #333";
  /*jshint multistr: true */
  var span='\
    <form id="passwd-{{$id}}" style="'+style+'" class="form-inline prompt-passwd" validate>\
      <input type="password" class="form-control" placeholder="valider avec votre mot de passe" required autofocus="true" style="width: 280px;">\
      <button class="btn btn-primary" ><i class="fa fa-unlock"></i></button>\
    </form>\
  ';
  return {
    restrict: 'A',
    replace: false,
    scope:{action:"&confirmDelete"},
    compile: function (element) {
      var e=element.after(span);
      return function(scope, element, attr, ctrl) {
        element.keyup(function(e) {
          if (e.keyCode == 27) {
            element.next('.prompt-passwd').remove();  
          }
        });
        element.bind('click', function(event) {
          angular.element('.prompt-passwd').hide();
          element.next().show();
        });
        element.next().submit(function(){
          var pwd=element.next().find('input[type=password]').val();
          scope.action({password:pwd});
          element.next().hide('.prompt-passwd');
          return false;
        });
      };
    }
  };
}]);

//
// Declare global directives here
UI.directive('ngFocus', ['$parse', function($parse) {
  return function(scope, element, attr) {
    var fn = $parse(attr.ngFocus);
    element.bind('focus', function(event) {
      scope.$apply(function() {
        fn(scope, {$event:event});
      });
    });
  };
}]);
 
UI.directive('ngBlur', ['$parse', function($parse) {
  return function(scope, element, attr) {
    var fn = $parse(attr.ngBlur);
    element.bind('blur', function(event) {
      scope.$apply(function() {
        fn(scope, {$event:event});
      });
    });
  };
}]);

UI.directive('backstretch', ['$parse', function($parse) {
  return{
    link:function(scope, element, attr, ctrl) { 
      var style={
        'background-size':'cover',
        'background-color':'transparent',
        'background-position': '50% 20%'
      };    
      
      function bs(e, path){
        if ((path.indexOf('http')!==0) && (path.indexOf('//')!==0))path='/'+path;
        style['background-image']='url('+path+')';
        e.css(style); 
              
      }
      var options=($parse(attr.backstretch))();
      var src=(options)?options.src:attr.backstretch;
      scope.$watch(src, function(value) {
          if (value){
            bs(element, value);
          }else if(options&&options.load){
            bs(element, options.load);
          }else if(src){
            //bs(element, src);
          }
       });
    }
  };
}]);



UI.directive('backfader', [
  '$parse','$location','$anchorScroll','$routeParams','$window','api', 
  function($parse,$location,$anchorScroll, $routeParams, $window, api) {
  var referrers=[], map={};
  return function(scope, element, attr) {
      var path=$location.path(), urldst='/';
      var elems=new RegExp("\/shop\/([A-Za-z0-9-]*)\/products").exec(path);
      if(elems && elems.length){
        urldst='/shop/'+elems[1];
      }

      // finally remove body scroll
      setTimeout(function() {
        angular.element("body").addClass('noscroll');
      },200);

      //
      // be sure to replace the scroller after quit
      scope.$on('$routeChangeStart', function (event, route) {
        angular.element("body").removeClass('noscroll');
      });

      //
      // on close
      element.find('.on-close').click(function(e){
        e.stopPropagation();
        if($window.referrer){
          return $window.history.back();
        }
        $window.location.pathname=urldst;
        
        return false;
      });
      element.click(function(event) {
        if(event.toElement===element[0]){
          if($window.referrer){
            return $window.history.back();
          }
          $window.location.pathname=urldst;
        }
      });       
  }
}]);

//
//
// affix
UI.directive('appAffix', ['$parse','$timeout', function($parse, $timeout) {
    return function(scope, element, attr) {
        $timeout(function(){
          element.affix({offset: parseInt(attr.appAffix)});
        },200);
    };
  }]);




UI.directive('toggleOnClick', ['$parse','$timeout', function($parse, $timeout) {
  return function(scope, element, attr) {
      $timeout(function(){
        var e=angular.element(attr.toggleOnClick);
        if(e.length){
          element.click(function(){
            e.toggleClass('hide');
          });
        }
      },1500);
  };
}]);


UI.directive('fadeOnHover', ['$parse','$timeout', function($parse, $timeout) {
  return function(scope, element, attr) {
      $timeout(function(){
        var e=angular.element(attr.fadeOnHover);
        if(e.length){
          e.bind('mouseenter', function(){
            element.fadeIn('fast');
          }).bind('mouseleave', function(){
            element.fadeOut('fast');
          });          
        }
      },10);

      element.hide();
  };
}]);


UI.directive('backendUrl', ['$parse','config', function($parse, config) {
  return function(scope, element, attr) {
      var name=attr.backendUrl||"href";
      element.attr(name,config.API_SERVER);
  };
}]);



})(window.angular);
