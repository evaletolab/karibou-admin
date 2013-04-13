
/**
 * Define the Shop directives for (app.shop) 
 * provides directives for interacting with Shop on views.
 */

function init($scope, elem, shop){


/**
  $('.shop-sidebar2').affix({
    offset: {
      top: function () { 
        var t=$window.width() <= 980 ? 470 : 340;
        return t; 
      }
    , bottom: 70
    }
  });
**/
  //
  // hover panel        
  $('.docs-sidebar',elem).unbind().hover(
    function(){
      $('fieldset.actions',elem).show();
    },
    function(){
      $('fieldset.actions',elem).fadeOut();
    }
  ); 

  $('#toggle-shop-edit').toggle(function(){
    $("#shop-edit").slideDown();
  },function(){
    $("#shop-edit").slideUp();
  });
  
  $('input.btn.undo').click(function(){
    $('#toggle-shop-edit').click();  
    return false;
  });
  
  
  $('#shop-edit ul.nav-tabs a').click(function (e) {
    e.preventDefault();
    $(this).tab('show');
  });

  if (!$('div.backstretch')[0])
    $('#bgshop').backstretch(shop.photo.fg);

  // on pick foreground shop img file		    
  $('button.onpickfile',elem).unbind().click(function(){
    filepicker.pick({
        mimetypes: ['image/*'],
        maxSize: 150*1024,
        services:['COMPUTER', 'FACEBOOK', 'GMAIL', 'INSTAGRAM'],
      },
      function(FPFile){
        //https://www.filepicker.io/api/file/PMaxCDthQd2buSL4lcym

        $('div.backstretch').remove();
        $('#bgshop').backstretch(FPFile.url);
        shop.photo.fg=FPFile.url;
        $scope.save(shop);
      },
      function(FPError){
        //alert(FPError.toString());
        console.log(FPError)
      }
    );
    return false;
  });

  // on pick owner shop img file		    
  $('button.onpickowner',elem).unbind().click(function(){
    filepicker.pick({
        mimetypes: ['image/*'],
        maxSize: 150*1024,
        services:['COMPUTER', 'FACEBOOK', 'GMAIL', 'INSTAGRAM'],
      },
      function(FPFile){
        var filter='/convert?w=260&fit=scale';
        elem.find('img.photo-owner').attr("src",FPFile.url+filter);
        shop.photo.owner=FPFile.url+filter;
        //console.log("filepicker",shop.photo)
        $scope.save(shop);
      },
      function(FPError){
        //alert(FPError.toString());
        console.log(FPError)
      }
    );
    return false;
  });
  
  elem.find('.toggle-next').toggle(function(e){
    e.preventDefault();
    $(e.target).parent().next().fadeIn();
  },function(e){
    e.preventDefault();
    $(e.target).parent().next().fadeOut();
  });
  
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
  //
  // save settings
  $('#shopctrl form.profile').unbind().submit(function(){
    $scope.save(shop);
    return false;
  });        
        
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





