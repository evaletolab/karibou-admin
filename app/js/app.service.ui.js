;(function(angular) {'use strict';


var UI=angular.module('app.ui',['app.config']);

// Declare global filters here, 
// Placehold will replace null img by default one from placehold.it 
// Example , with img is Null {{img|plahold:'80x80'}} => http://placehold.it/80x80 
UI.filter("placehold",function(){
  return function(img,params){
    if (img)return img;
    return "http://placehold.it/"+params;
  }
});

UI.filter("categories",function(){
  return function(categories,type){
    if (!categories || type==='*')return categories;
    var t=(type)?type:'Category';
    return _.filter(categories,function(c){c.type===t});
  }
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
  function($compile, $templateCache) {
    return {
      restrict: 'A',
      priority: 400,
      compile: function(element, attrs){
        var templateName = attrs.ngStaticInclude;
        var template = $templateCache.get(templateName);
        return function(scope, element){
          element.html(template);
          $compile(element.contents())(scope);
        };
      }
    };
  }
]);

//
// load image as background image
UI.directive("bgSrc", function () {
  return {
      restrict: 'A',
      link: function(scope, element, attrs){
        element[ 0 ].style.backgroundImage = "url("+attrs.bgSrc+")";
      }
  };
});

//Send gg event {category:'',action:''}
UI.directive('gaSend', ['$parse','$window','config',function($parse,$window, config) {
  return function(scope, element, attr) {
    var o = $parse(attr['gaSend'])();
    //
    // send gg analitycs
    if($window.ga && config.API_SERVER.indexOf('localhost')==-1){
      element.click(function(){
          $window.ga('send', 'event', o.category, o.action);        
          // if(console)console.log('ga',o)
      })
    }
  }
}]);

//
// reload page
UI.directive('reload', ['$parse','$timeout', function($parse, $timeout) {
  return function(scope, element, attr) {
    var path = attr['reload']||'/';
    $timeout(function(){
        window.location.pathname = path
    },5000)
  }
}]);


//
// start progress for usability
UI.directive('startProgress', ['$parse','$timeout', function($parse, $timeout) {
  return function(scope, element, attr) {
    var option = attr['startProgress']||{};
    element.bind('click', function(event) {
      NProgress.start();
    })
  }
}]);


//
// Declare global directives here
UI.directive('toggleSidebar', ['$parse','$timeout', function($parse, $timeout) {
  return function(scope, element, attr) {
    var sb = $parse(attr['toggleSidebar']);
    var $body=$("body");
    $('button.site-nav-logo').click(function(){
        $body.addClass("site-nav-transition site-nav-drawer-open");
        $("button.site-nav-logo").css('opacity',0);
      })
    $timeout(function(){
      function hide(){
          $body.removeClass("site-nav-drawer-open");  
          $timeout(function(){
            $("button.site-nav-logo").css({opacity:1,'z-index':1000});
            $body.removeClass("site-nav-transition ");  
          },800);        
      }
      $(".site-nav-overlay").click(hide);
      $("a").click(hide)

    },1000)
  }
}]);




//
// Declare global directives here
UI.directive('confirmDelete', ['$parse', function($parse) {
  //
  // template
  var style="width: 300px;position: absolute;border: 2px solid red;padding: 10px;background-color: white;margin-top:-20px;display:none;left:25%;box-shadow:1px 1px 1000px #333"
  var span='\
    <form id="passwd-{{$id}}" style="'+style+'" class="form-inline prompt-passwd" validate>\
      <input type="password" class="form-control" placeholder="valider avec votre mot de passe" required autofocus="true" style="width: 220px;">\
      <button class="btn btn-primary" ><i class="icon-unlock"></i></button>\
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
          element.next().show()
        });
        element.next().submit(function(){
          var pwd=element.next().find('input[type=password]').val();
          scope.action({password:pwd});
          element.next().hide()
          return false;
        })
      }
    }
  }
}]);

//
// Declare global directives here
UI.directive('ngFocus', ['$parse', function($parse) {
  return function(scope, element, attr) {
    var fn = $parse(attr['ngFocus']);
    element.bind('focus', function(event) {
      scope.$apply(function() {
        fn(scope, {$event:event});
      });
    });
  }
}]);
 
UI.directive('ngBlur', ['$parse', function($parse) {
  return function(scope, element, attr) {
    var fn = $parse(attr['ngBlur']);
    element.bind('blur', function(event) {
      scope.$apply(function() {
        fn(scope, {$event:event});
      });
    });
  }
}]);

UI.directive('backstretch', ['$parse', function($parse) {
  return{
    link:function(scope, element, attr, ctrl) { 
      var style={
        'background-size':'cover',
        'background-position': 'center center'
      };    
      
      function bs(e, path){
        if($.browser && $.browser.msie && $.browser.version<8){
          e.find('div.backstretch').remove();
          e.backstretch(path);
          return;
        }
        if (path.indexOf('http')==-1)path='/'+path;
        style['background-image']='url('+path+')';
        e.css(style);	
              
      }
      var options=($parse(attr['backstretch']))();
      var src=(options)?options.src:attr['backstretch']
      scope.$watch(src, function(value) {
          if (value){
            bs(element, value)
          }else if(options['load']){
            bs(element, options.load)
          }else{
            bs(element, src)
          }
       });
    }
  }
}]);

UI.directive('background', ['$parse', function($parse) {
  return{
    link:function(scope, element, attr, ctrl) {   
      var options=($parse(attr['background']))();
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
  }
}]);


UI.directive('backfader', ['$parse','$location','$anchorScroll','$routeParams', function($parse,$location,$anchorScroll, $routeParams) {
  return function(scope, element, attr) {
      angular.element("body").addClass('noscroll');
      var i=setInterval(function(){
        if(!element.is(":visible")){
          angular.element("body").removeClass('noscroll');
          clearInterval(i);
        }
      },2000);
      element.removeClass('hide').click(function(e) {
		    if(e.target === element[0]){
          angular.element("body").removeClass('noscroll');
          var url
          if(scope.computeUrl)
            url=scope.computeUrl();
          else
            url=scope.referrer
          

          //
          // FIXME place the RegExp() in the template attr['backfader']
          // var url=$location.path().replace(/^(.*\/[0-9]+)\/edit$/,"$1");
          // if (url===$location.path()) url=url.replace(/^(.*)\/[0-9]+$/,"$1");
          // if (url===$location.path()) {
          //   window.history.back();
          //   return;
          // }
          window.scrollBy(scope.scrollLeft,scope.scrollTop);
          scope.$apply(function(){
            $location.path(url)
          });
          return;
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
	        element.affix({offset: parseInt(attr['appAffix'])});
	      },200);
	  }
	}]);

//
// http://dev.dforge.net/projects/sliding-pane/index.html
// 
UI.directive('pageslide', ['$parse','$timeout', function($parse , $timeout) {
  return function(scope, element, attr) {
    var o=scope.$eval(attr.pageslide||"{}");
    element.pageslide(o)
    //$("img.lazy").show().lazyload();
  }
}]);

//
//
// http://masonry.desandro.com/docs/intro.html
UI.directive('lazyload', ['$parse','$timeout', function($parse , $timeout) {
  return function(scope, element, attr) {
    //$("img.lazy").show().lazyload();
  }
}]);



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

  }
}]);


UI.directive('slideOnClick', ['$parse','$timeout', function($parse, $timeout) {
  return function(scope, element, attr) {
      $timeout(function(){
        var e=angular.element(attr['slideOnClick']);
        if(e.length){

          element.click(function(){
            e.slideDown();
          });
        }
      },0);
  }
}]);
UI.directive('showOnClick', ['$parse','$timeout', function($parse, $timeout) {
  return function(scope, element, attr) {
      $timeout(function(){
        var e=angular.element(attr['showOnClick']);
        if(e.length){
          element.click(function(){
            e.slideDown();
          });
        }
      },0);
  }
}]);
UI.directive('hideOnClick', ['$parse','$timeout', function($parse, $timeout) {
  return function(scope, element, attr) {
      $timeout(function(){
        var e=angular.element(attr['hideOnClick']);
        if(e.length){
          element.click(function(){
            e.slideUp();
          });
        }
      },0);
  }
}]);

UI.directive('toggleOnClick', ['$parse','$timeout', function($parse, $timeout) {
  return function(scope, element, attr) {
      $timeout(function(){
        var e=angular.element(attr['toggleOnClick']);
        if(e.length){
          element.click(function(){
            e.toggle();
          });
        }
      },1500);
  }
}]);


UI.directive('fadeOnHover', ['$parse','$timeout', function($parse, $timeout) {
  return function(scope, element, attr) {
      $timeout(function(){
        var e=angular.element(attr['fadeOnHover']);
        if(e.length){
          e.bind('mouseenter', function(){
            element.fadeIn('fast');
          }).bind('mouseleave', function(){
            element.fadeOut('fast');
          })          
        }
      },10);

      element.hide();
  }
}]);

UI.directive('infiniteCarousel', ['$parse','$timeout', function($parse , $timeout) {
  return function(scope, element, attr) {
    var options={}, expression = scope.$eval(attr.infiniteCarousel||"{}");
    angular.extend(options, expression);        
    $timeout(function(){
       
       $(element).addClass("infiniteCarousel").infiniteCarousel(options)
    },0);

  }
}]);

UI.directive('backendUrl', ['$parse','config', function($parse, config) {
  return function(scope, element, attr) {
      var name=attr.backendUrl||"href";
      element.attr(name,config.API_SERVER);
  }
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

  }
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
