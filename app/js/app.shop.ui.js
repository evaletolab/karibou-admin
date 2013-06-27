
/**
 * Define the Shop directives for (app.shop) 
 * provides directives for interacting with Shop on views.
 */

function init($scope, elem, shop){

  
  if($scope.user.isOwner(shop.name)){
    // FIXME wysihtml5 is to big ~100k,
    /*
    var editor=$("#content-edit");
    console.log(editor.attr('init'))
    if (!editor.attr('init')){ 
      editor.attr('init',true);
      $("#content-edit").freshereditor({toolbar_selector: "#toolbar", excludes: ['removeFormat', 'insertheading4','forecolor','backcolor']})
      $("#content-edit").freshereditor("edit", true);
    }
    /**
    var editor = new wysihtml5.Editor("content-edit", { // id of textarea element
        toolbar:      "wysihtml5-editor-toolbar", // id of toolbar element
        style : true,
        parserRules:  wysihtml5ParserRules // defined in parser rules set 
    });
    editor.on('focus',function(){

      $('#wysihtml5-editor-toolbar').show();
    });
    editor.on('blur',function(){
      $('#wysihtml5-editor-toolbar').hide();
    });
    **/
  }
        
}

angular.module('app.shop.ui', [
  'app.config', 
  'app.api'
]).directive("shopscript", function () {
  return {
      restrict: 'E',
      link: function(scope, element, attrs)
      {
          scope.$watch( 'shop', function(shop) {
              
              if(shop){
                init(scope,element, shop);
              }
           
              //element.css( changes );
          }, true );
      }
  };
})

/**
 * Binds a freshereditor widget to <textarea> elements.
 */
.directive('uiFreshereditor', [function () {
  return {
    require: 'ngModel',
    link: function (scope, elm, attrs, ngModel) {
      var expression,
        options = {
          // Update model on change
          change: function (inst) {
            console.log("ui fresh inst", update)
            if (inst.isDirty()) {
              inst.save();
              ngModel.$setViewValue(elm.val());
              if (!scope.$$phase)
                scope.$apply();
            }
          }
        },
        config={
          toolbar_selector: "#toolbar", 
          excludes: ['removeFormat', 'insertheading1','insertheading2','insertheading3','insertheading4','forecolor','backcolor', 'createlink','insertimage','insertorderedlist','insertunorderedlist','code', 'fontname']
        };
      if (attrs.uiFreshereditor) {
        expression = scope.$eval(attrs.uiFreshereditor);
      } else {
        expression = {};
      }
      angular.extend(options, config, expression);

      setTimeout(function () {
        elm.freshereditor(options);
        elm.freshereditor("edit", false);
      });
    }
  };
}])

.directive('bspopover', function($timeout) {
  return {
    link: function(scope, elm, attr) {
      var popup=$(attr.selector);
      var cl=(attr.popoverClass)?attr.popoverClass:'';
      setTimeout(function () {
        elm.popover({
          html : true,
          content:popup.html(),
          template: '<div class="popover '+cl+'"><div class="arrow"></div><div class="popover-inner "><h3 class="popover-title"></h3><div class="popover-content"><p></p></div></div></div>'        
        });
        
        console.log(popup)
      });      
      
      elm.bind('click', function(e) {
      });      
    }
  };
});





