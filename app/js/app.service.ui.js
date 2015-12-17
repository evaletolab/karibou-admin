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

UI.filter("categories",function(){
  return function(categories,type){
    if (!categories || type==='*')return categories;
    var t=(type)?type:'Category';
    return _.filter(categories,function(c){return c.type===t;});
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

UI.filter('reverse', function() {
  return function(items) {
    if(!items)return;
    return items.slice().reverse();
  };
});

UI.filter('unique', function() {
    return function (arr, field) {
        return _.uniq(arr, function(a) { return a[field]; });
    };
});



UI.filter('capitalize', function() {
  return function(input, scope) {
    var lst=[];
    if (!input){
      return '';
    }

    lst=input.split(' ');
    for (var i = lst.length - 1; i >= 0; i--) {
      lst[i]=lst[i].toLowerCase();
      lst[i]=lst[i].substring(0,1).toUpperCase()+lst[i].substring(1);
    }
    return lst.join(' ');
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
    if($window.ga && config.API_SERVER.indexOf('localhost')==-1 && config.API_SERVER.indexOf('evaletolab')==-1){
      if(!$window._gaUserId && user.isAuthenticated()){
        $window._gaUserId=user.id;
        // Définir l'ID utilisateur à partir du paramètre user_id de l'utilisateur connecté.        
        $window.ga('set', '&uid', $window._gaUserId);
      }

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
UI.directive('toggleSidebar', ['$parse','$timeout','$rootScope', function($parse, $timeout, $rootScope) {
  return function(scope, element, attr) {
    function hide(){
        if(scope.options.sidebar)return;
        scope.options.sidebar=false;
        $timeout(function(){
          $("button.site-nav-logo").css({opacity:1,'z-index':1000});
        },800);        
    }
    //$(".site-nav-overlay").click(hide);
    document.addEventListener("click", hide);

    // $rootScope.$on('documentClicked',hide);
  };
}]);




//
// Declare global directives here
UI.directive('confirmDelete', ['$parse', function($parse) {
  //
  // template
  var style="width: 300px;position: absolute;border: 2px solid red;padding: 10px;background-color: white;margin-top:-20px;display:none;left:25%;box-shadow:1px 1px 1000px #333";
  /*jshint multistr: true */
  var span='\
    <form id="passwd-{{$id}}" style="'+style+'" class="form-inline prompt-passwd" validate>\
      <input type="password" class="form-control" placeholder="valider avec votre mot de passe" required autofocus="true" style="width: 220px;">\
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
        element.bind('click', function(event) {
          angular.element('.prompt-passwd').hide();
          element.next().show();
        });
        element.next().submit(function(){
          var pwd=element.next().find('input[type=password]').val();
          scope.action({password:pwd});
          element.next().hide();
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

UI.directive('background', ['$parse', function($parse) {
  return{
    link:function(scope, element, attr, ctrl) {   
      var options=($parse(attr.background))();
      var css={
        'background-size':'100%', 
        '-webkit-background-size':'100%',
        'background-repeat':'no-repeat'
      };      
      scope.$watch(options.src, function(value) {
          if (value){
            css.background='url('+value+')';
          }else if(options.load){
            css.background='url('+options.load+')';
          }else{
            css.background='url('+options.src+')';
          }
          element.css(css);
       });
    }
  };
}]);

UI.directive('computeUrl', ['$parse','api', function($parse,api) {
  return{
    link:function(scope, element, attr, ctrl) {   
      var url=($parse(attr.computeUrl))();
      element.attr('href',api.computeUrl(url));
    }
  };
}]);


UI.directive('backfader', ['$parse','$location','$anchorScroll','$routeParams','api', function($parse,$location,$anchorScroll, $routeParams,api) {
  var referrers=[], map={};
  return function(scope, element, attr) {
      var path=$location.path();

      // finally remove body scroll
      setTimeout(function() {
        angular.element("body").addClass('noscroll');
      },200);

      var referrer;
      scope.referrer&&referrers.push(scope.referrer);
      // manage state
      //if current path is not on referrer, ok
      if(referrers.indexOf(path)===-1){
        referrer=scope.referrer;
      }else{
        var index=referrers.indexOf(path);
        referrers.splice(index,referrers.length-index);
        referrer=referrers[index-1];
      }

      //
      // be sure to replace the scroller after quit
      scope.$on('$routeChangeStart', function (event, route) {
        angular.element("body").removeClass('noscroll');
      });

      // save 
      map[path]=referrer;

      // console.log('open --------------['+path+']',referrer);
  

      (function(referrer, scrollLeft,scrollTop){
        function onClose(){
          var refid, path=$location.path(),url;
          angular.element("body").removeClass('noscroll');
          // cases
          // - product is open in edit mode
          // - product is open in normal mode and then edited
          if(api.computeUrl){
            url=api.computeUrl(map[path])
          }
          else{
            url=map[path]||path;
          }
          

          window.scrollBy(scrollLeft,scrollTop);
          scope.$apply(function(){
            referrers=_.uniq(referrers);
            $location.path(url);
          });
        }

        element.find('.on-close').click(function(e){
          e.stopPropagation();
          onClose();
          return false;
        });
        element.removeClass('hide').click(function(e) {
          if(e.target === element[0]){
            onClose();
          }
        });     


      })(referrer,scope.scrollLeft,scope.scrollTop);
  };
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

//
// http://dev.dforge.net/projects/sliding-pane/index.html
// 
UI.directive('pageslide', ['$parse','$timeout', function($parse , $timeout) {
  return function(scope, element, attr) {
    var o=scope.$eval(attr.pageslide||"{}");
    element.pageslide(o);
    //$("img.lazy").show().lazyload();
  };
}]);

//
//
// http://masonry.desandro.com/docs/intro.html
UI.directive('lazyload', ['$parse','$timeout', function($parse , $timeout) {
  return function(scope, element, attr) {
    //$("img.lazy").show().lazyload();
  };
}]);

UI.directive('autoSubmit', ['$parse','$timeout','user', function($parse , $timeout, user) {
  return function(scope, element, attr) {
    var target=angular.element('#'+attr.target),
        firstTime=true;


    function tick() {
        if(firstTime)element.submit();
        firstTime=false;

        //
        // simple check of payment validation
        user.me(function(u){
          console.log('psp ecommerce payment is live',u.payments);
        });

    }
    $timeout(tick, 2000);    
  };
}]);


UI.directive('iframeAutoHeight', [function(){
return {
    restrict: 'A',
    link: function(scope, element, attrs){
        element.on('load', function(){
            /* Set the dimensions here, 
               I think that you were trying to do something like this: */
               var iFrameHeight = element[0].contentWindow.document.body.scrollHeight + 'px';
               var iFrameWidth = '100%';
               element.css('width', iFrameWidth);
               if(iFrameHeight!==0)
                element.css('height', iFrameHeight);
        });
    }
};}]);


//
//
// http://masonry.desandro.com/docs/intro.html
UI.directive('masonry', ['$parse','$timeout', function($parse , $timeout) {
  return function(scope, element, attr) {
    var options={itemSelector : '.block', columnWidth : 1,gutter:1}, expression = scope.$eval(attr.mansory||"{}");
    angular.extend(options, expression);        
    
    $timeout(function(){
      new Masonry( element.get(0),options);      
      
      //element.imagesLoaded(function(){
      //  element.masonry(options);
      //});

    },1000);

  };
}]);


UI.directive('slideOnClick', ['$parse','$timeout', function($parse, $timeout) {
  return function(scope, element, attr) {
      $timeout(function(){
        var e=angular.element(attr.slideOnClick);
        if(e.length){
          element.click(function(){
            e.slideDown();
          });
          // element.slideToggle('slow');
          // element.click(function(){
          //   if(e.is(':visible')){
          //     e.slideDown();
          //   }else{
          //     e.slideDown();              
          //   }
          // });
        }
      },0);
  };
}]);
UI.directive('showOnClick', ['$parse','$timeout', function($parse, $timeout) {
  return function(scope, element, attr) {
      $timeout(function(){
        var e=angular.element(attr.showOnClick);
        if(e.length){
          element.click(function(){
            e.slideDown();
          });
        }
      },0);
  };
}]);
UI.directive('hideOnClick', ['$parse','$timeout', function($parse, $timeout) {
  return function(scope, element, attr) {
      $timeout(function(){
        var e=angular.element(attr.hideOnClick);
        if(e.length){
          element.click(function(){
            e.slideUp();
          });
        }
      },0);
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

UI.directive('infiniteCarousel', ['$parse','$timeout', function($parse , $timeout) {
  return function(scope, element, attr) {
    var options={}, expression = scope.$eval(attr.infiniteCarousel||"{}");
    angular.extend(options, expression);        
    $timeout(function(){
       
       $(element).addClass("infiniteCarousel").infiniteCarousel(options);
    },0);

  };
}]);

UI.directive('backendUrl', ['$parse','config', function($parse, config) {
  return function(scope, element, attr) {
      var name=attr.backendUrl||"href";
      element.attr(name,config.API_SERVER);
  };
}]);


UI.directive('lazySrc', ['$document', '$parse', function($document, $parse) {
        return {
            restrict: 'A',
            link: function(scope, elem, attr) {
                function setLoading(elm) {
                    if (loader) {
                        elm.html('');
                        elm.append(loader);
                        elm.css({
                            'background-image': null
                        });
                    }
                }
                var loader = null;
                if (angular.isDefined(attr.lazyLoader)) {
                    loader = angular.element($document[0].querySelector(attr.lazyLoader)).clone();
                }
                var bgModel = $parse(attr.lazySrc);
                scope.$watch(bgModel, function(newValue) {
                    setLoading(elem);
                    var src = bgModel(scope);
                    var img = $document[0].createElement('img');
                    img.onload = function() {
                        if (loader) {
                            loader.remove();
                        }
                        if (angular.isDefined(attr.lazyLoadingClass)) {
                            elem.removeClass(attr.lazyLoadingClass);
                        }
                        if (angular.isDefined(attr.lazyLoadedClass)) {
                            elem.addClass(attr.lazyLoadedClass);
                        }
                        elem.css({
                            'background-image': 'url(' + this.src + ')'
                        });
                    };
                    img.onerror= function() {
                        //console.log('error');
                    };
                    img.src = src;
                });
            }
        };
    }]);

})(window.angular);
