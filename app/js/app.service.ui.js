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


//
// http://stackoverflow.com/questions/19992090/angularjs-group-by-directive
UI.filter('groupBy', ['$parse', function ($parse) {
    return function (list, group_by) {

        var filtered = [];
        var prev_item = null;
        var group_changed = false;
        // this is a new field which is added to each item where we append "_CHANGED"
        // to indicate a field change in the list
        //was var new_field = group_by + '_CHANGED'; - JB 12/17/2013
        var new_field = 'group_by_CHANGED';

        // loop through each item in the list
        angular.forEach(list, function (item) {

            group_changed = false;

            // if not the first item
            if (prev_item !== null) {

                // check if any of the group by field changed

                //force group_by into Array
                group_by = angular.isArray(group_by) ? group_by : [group_by];

                //check each group by parameter
                for (var i = 0, len = group_by.length; i < len; i++) {
                    if ($parse(group_by[i])(prev_item) !== $parse(group_by[i])(item)) {
                        group_changed = true;
                    }
                }


            }// otherwise we have the first item in the list which is new
            else {
                group_changed = true;
            }

            // if the group changed, then add a new field to the item
            // to indicate this
            if (group_changed) {
                item[new_field] = true;
            } else {
                item[new_field] = false;
            }

            filtered.push(item);
            prev_item = item;

        });

        return filtered;
    };
}]);

//
// simple ngInclude
// http://zachsnow.com/#!/blog/2014/angularjs-faster-ng-include/
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
      priority: 400,
      compile: function(element, attrs){
        var templateName = $sce.parseAsResourceUrl(attrs.ngStaticInclude)();
        return function(scope, element){
          // var template = $templateCache.get(templateName);
          // if(template){
          //   return includeTpl(element,template,scope)
          // }
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
        $window.ga('set', 'userId', $window._gaUserId);
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
UI.directive('toggleSidebar', ['$parse','$timeout', function($parse, $timeout) {
  return function(scope, element, attr) {
    function hide(){
        if(scope.options.sidebar)return;
        scope.options.sidebar=false;
        $timeout(function(){
          $("button.site-nav-logo").css({opacity:1,'z-index':1000});
        },800);        
    }
    //$(".site-nav-overlay").click(hide);
    $(document).click(hide);
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
        'background-position': 'center center'
      };    
      
      function bs(e, path){
        // if($.browser && $.browser.msie && $.browser.version<8){
        //   e.find('div.backstretch').remove();
        //   e.backstretch(path);
        //   return;
        // }
        // console.log('------------',path)
        if ((path.indexOf('http')!==0) && (path.indexOf('//')!==0))path='/'+path;
        style['background-image']='url('+path+')';
        e.css(style); 
              
      }
      var options=($parse(attr.backstretch))();
      var src=(options)?options.src:attr.backstretch;
      scope.$watch(src, function(value) {
          if (value){
            bs(element, value);
          }else if(options.load){
            bs(element, options.load);
          }else{
            bs(element, src);
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



UI.directive('backfader', ['$parse','$location','$anchorScroll','$routeParams', function($parse,$location,$anchorScroll, $routeParams) {
  var referrers=[];
  return function(scope, element, attr) {

      angular.element("body").addClass('noscroll');
      var referrer;
      referrers.push(scope.referrer);
      // manage state
      //if current path is not on referrer, ok
      if(referrers.indexOf($location.path())===-1){
        referrer=scope.referrer;
      }else{
        var index=referrers.indexOf($location.path());
        referrers.splice(index,referrers.length-index);
        referrer=referrers[index-1];
        //return;
      }


      // var i=setInterval(function(){
      //   if(!element.is(":visible")){
      //     angular.element("body").removeClass('noscroll');
      //     clearInterval(i);
      //   }
      // },2000);
      //if current path is already in referrers => remove all
      //console.log('input backfader', referrers,referrers.length-1);

      (function(referrer, scrollLeft,scrollTop){
        function onClose(){
          //console.log('output backfader ---------------', referrer, scrollLeft,scrollTop)
          angular.element("body").removeClass('noscroll');
          var url=referrer;
          if(!url&&scope.computeUrl)
            url=scope.computeUrl();
          

          //
          // FIXME place the RegExp() in the template attr['backfader']
          // var url=$location.path().replace(/^(.*\/[0-9]+)\/edit$/,"$1");
          // if (url===$location.path()) url=url.replace(/^(.*)\/[0-9]+$/,"$1");
          // if (url===$location.path()) {
          //   window.history.back();
          //   return;
          // }
          window.scrollBy(scrollLeft,scrollTop);
          scope.$apply(function(){
            $location.path(url);
          });
        }

        // FIXME find a best way to clean on exit 
        element.find('a').click(function (e) {
          setTimeout(function() {
            if(!element.is(":visible")){
              angular.element("body").removeClass('noscroll');
            }            
          }, 300);
        });
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

UI.directive('acceptCookie', ['$parse','config','$cookies','$timeout', 
  function($parse, config, $cookies, $timeout) {
  return function(scope, element, attr) {
    $timeout(function(){
      if ($cookies['session.sid']){
        return;        
      }
      element.attr("src",config.ACCEPT_COOKIE);
      element.attr("style","height:100px;width:100%");

    },2000);

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
