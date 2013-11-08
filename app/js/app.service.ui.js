'use strict';


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
        if($.browser.msie && $.browser.version<8){
          e.find('div.backstretch').remove();
          e.backstretch(path);
          return;
        }
        style['background-image']='url('+path+')';
        e.css(style);	
              
      }
      var options=($parse(attr['backstretch']))();
      scope.$watch(options.src, function(value) {
          if (value){
            bs(element, value)
          }else if(options.load){
            bs(element, options.load)
          }else{
            bs(element, options.src)
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


UI.directive('backfader', ['$parse','$location','$anchorScroll', function($parse,$location,$anchorScroll) {
  return function(scope, element, attr) {
      //console.log("app.service:backfader", element, attr['backfader'])
      
      angular.element("body").addClass('noscroll');
      var i=setInterval(function(){
        if(!element.is(":visible")){
          angular.element("body").removeClass('noscroll');
          clearInterval(i);
        }
      },2000);
      element.removeClass('hide').click(function(e) {
		    if(e.target === element[0]){
		      //console.log($location.path())
          angular.element("body").removeClass('noscroll');

          //
          // FIXME place the RegExp() in the template attr['backfader']
          var url=$location.path().replace(/^(.*\/[0-9]+)\/edit$/,"$1");
          if (url===$location.path()) url=url.replace(/^(.*)\/[0-9]+$/,"$1");
          if (url===$location.path()) {
            window.history.back();
            return;
          }
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
	        element.affix({offset: attr['npAffix']});
	      },0);
	  }
	}]);

//
// http://dev.dforge.net/projects/sliding-pane/index.html
// 
UI.directive('pageslide', ['$parse','$timeout', function($parse , $timeout) {
  return function(scope, element, attr) {
    //console.log('lazyload')
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
    //console.log('lazyload')
    //$("img.lazy").show().lazyload();
  }
}]);



//
//
// http://masonry.desandro.com/docs/intro.html
UI.directive('masonry', ['$parse','$timeout', function($parse , $timeout) {
  return function(scope, element, attr) {
      //console.log("app.service:backstretch", element, attr['backstretch'])
    var options={itemSelector : '.block', columnWidth : 1,gutter:1}, expression = scope.$eval(attr.mansory||"{}");
    angular.extend(options, expression);        
    
    $timeout(function(){
      //console.log('masonry',options)
      //console.log(element,element.get(0))
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
          element.toggle(function(){
            e.slideDown();
          },
          function(){
            e.slideUp();
          })
        }
      },500);
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
      },60);
      element.hide();
  }
}]);

UI.directive('infiniteCarousel', ['$parse','$timeout', function($parse , $timeout) {
  return function(scope, element, attr) {
    var options={}, expression = scope.$eval(attr.infiniteCarousel||"{}");
    angular.extend(options, expression);        
    $timeout(function(){
       console.log(attr)
       
       $(element).addClass("infiniteCarousel").infiniteCarousel(options)
    },0);

  }
}]);

UI.directive('backendUrl', ['$parse','config', function($parse, config) {
  return function(scope, element, attr) {
      var name=attr.backendUrl||"href";
      console.log(name,config.API_SERVER)
      element.attr(name,config.API_SERVER);
  }
}]);
