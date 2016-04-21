;(function(angular) {'use strict';

//
// Define the Document module (app.document)  for controllers, services and models
// the app.document module depend on app.config and take resources in document/*.html 
angular.module('app.document.ui', [])
  .directive('i18nRender',i18nRender)
  .directive('markdownRender',markdownRender)
  .directive('contenteditable',inlineEdit);



//
// directives
inlineEdit.$inject=['$parse'];
function inlineEdit ($parse) {
  var LINEBREAK_REGEX = /\n/g,
      BR_REGEX = /<(br|p|div)(\/)?>/g,
      TAG_REGEX = /<.+?>/g,
      NBSP_REGEX = /&nbsp;/g,
      BLOCKQUOTE_REGEX = /&gt;/g,
      OPEN_TAG_REGEX = /```&lt;/g,
      OPEN_TAG_REVERSE_REGEX = /```\</g,
      OPEN_TAG_NEWLINE_REGEX = /```\n&lt;/g,
      OPEN_TAG_NEWLINE_REVERSE_REGEX = /```\n</g,
      TRIPLE_LINEBREAK_REGEX = /\n\n\n/g, 
      // Make sure to scrub triple line breaks... they don't make much sense in MD.
      DOUBLE_SPACE_REGEX = /\s\s/g;

  return {
    restrict:'A',
    require: 'ngModel',
    priority: 2000,
    link: function(scope, elm, attrs, ngModel) {
            
      //
      // what you return here will be passed to the text field
      ngModel.$formatters.unshift(function (modelValue) {
        return modelValue;
      });

      // put the inverse logic, to transform formatted data into model data
      // what you return here, will be stored in the $scope            
      ngModel.$parsers.unshift(function (viewValue) {
        return viewValue;
      });

      elm.on('focus', function () {
        var text = ngModel.$viewValue;

        if (text) {
          text = text.replace(OPEN_TAG_REVERSE_REGEX, "```&lt;");
          text = text.replace(OPEN_TAG_NEWLINE_REVERSE_REGEX, "```\n&lt;");
          text = text.replace(LINEBREAK_REGEX, "<br/>");
          text = text.replace(DOUBLE_SPACE_REGEX, "&nbsp; ");

          elm.html(text);
        }

      });

      // view -> model
      elm.bind('blur', function() {
        scope.$apply(function() {
          var html=elm.html();
          html = html.replace(BR_REGEX, "\n");
          html = html.replace(TAG_REGEX, "");
          html = html.replace(NBSP_REGEX, " ");
          html = html.replace(OPEN_TAG_REGEX, "```<");
          html = html.replace(OPEN_TAG_NEWLINE_REGEX, "```\n<");
          html = html.replace(BLOCKQUOTE_REGEX, ">");
          html = html.replace(TRIPLE_LINEBREAK_REGEX, "\n\n");
          ngModel.$setViewValue(html);
          ngModel.$render();
        });
      });

      // model -> view
      ngModel.$render = function(value) {
        if(window.Remarkable &&attrs.contentMakrdown!=='false'){
          var converter = new Remarkable();
          elm.html(converter.render(ngModel.$viewValue));
          return;
        }

        elm.html(ngModel.$viewValue);
      };

      // load init value from DOM
      // var parsed=$parse(elm.html())
      // ngModel.$setViewValue(elm.html());

      elm.bind('keydown', function(event) {
        // console.log("keydown " + event.which);
        var esc = event.which == 27,
            el = event.target;

        if(esc){
          ngModel.$setViewValue(elm.html());
          el.blur();
          event.preventDefault();                        
        }
      });
    }
  };
}


//
// compile markdown
markdownRender.$inject=['$compile','$timeout','$translate','config'];
function markdownRender($compile,$timeout,$translate,config) {
  return {
    restrict: 'A',
    replace: true, 
    scope:{markdownRender:'='},
    priority:1,
    link: function(scope, element, attrs, ngModelCtrl) {
      var self=this;
      var converter = new Remarkable();

      scope.$watch('markdownRender', function (markdownRender) {
        if (scope['markdownRender']) {
          // var el = $compile()(scope);
          element.replaceWith(converter.render(scope.markdownRender));
        }
      });
    }
  };
}



//
// use default i18n
// options: parseMarkdown
//
i18nRender.$inject=['$rootScope','$interpolate','$timeout','$translate','config'];
function i18nRender($rootScope,$interpolate,$timeout,$translate,config) {
  return {
    restrict: 'A',
    replace: true, 
    scope:{i18nRender:'='},
    priority:1,
    link: function(scope, element, attrs) {
      var self=this;
      var converter = new Remarkable();


      function  render() {
        // init
        var lang=$translate.use(),
            defaultLang=config.shop.i18n&&config.shop.i18n.defaultLocale,
            content=undefined;

        // init content
        if(scope['i18nRender']){
          content=scope['i18nRender'][lang];
        }

        // run
        if(!content && scope['i18nRender']){
          content=scope['i18nRender'][defaultLang];
        }

        if(attrs.parseMarkdown){
          content=converter.render(content);
        }

        try{
          content=content||'';
          var el = $interpolate(content)(scope);          
          element.html(el);
        }catch(e){
          element.html(content);
        }
      }

      scope.$watch('i18nRender', function (i18nRender) {
        if (scope['i18nRender']) {
          $timeout(render,100);
          // scope.$parent.$watch(function () {
          //   angular.extend(scope.interpolateParams, $parse(interpolateParams)(scope.$parent));
          // });
        }
      });

      // trigger rendering of translation
      $rootScope.$on('$translateChangeSuccess', render);
      // config.shop.then(function (argument) {
      //   $timeout(render,100);
      // });
    }
  };
}


})(window.angular);
