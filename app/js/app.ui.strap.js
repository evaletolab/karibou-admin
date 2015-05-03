;(function(angular) {'use strict';

var $strap=angular.module('$strap',[]);


$strap.factory('$modal', [
  '$rootScope', 
  '$compile', 
  '$http', 
  '$timeout', 
  '$q', 
  '$templateCache',
  function($rootScope, $compile, $http, $timeout, $q, $templateCache) {

  var ModalFactory = function ModalFactoryFn(config) {

    function Modal(config) {

      var options = angular.extend({show: true}, {}, config),
          scope = options.scope ? options.scope : $rootScope.$new(),
          templateUrl = options.template;

      return $q.when($templateCache.get(templateUrl) || $http.get(templateUrl, {cache: true}).then(function(res) { return res.data; }))
      .then(function onSuccess(template) {

        // Build modal object
        var id = templateUrl.replace('.html', '').replace(/[\/|\.|:]/g, '-') + '-'  +scope.$id;

        var $modal = $('<div class="modal " tabindex="-1"></div>').attr('id', id).addClass('fade').html(template);
        if(options.modalClass) $modal.addClass(options.modalClass);
        //$('#'+id).remove();
        $('body').append($modal);

        // Compile modal content
        $timeout(function() {
          $compile($modal)(scope);
        },0);

        // Provide scope display functions
        scope.$modal = function(name) {
          $modal.modal(name);
        };
        angular.forEach(['show', 'hide'], function(name) {
          scope[name] = function() {
            $modal.modal(name);
          };
        });
        scope.dismiss = function () {
          scope.hide();
        };

        // Emit modal events
        angular.forEach(['show', 'shown', 'hide', 'hidden'], function(name) {
          $modal.on(name, function(ev) {
            scope.$emit('modal-' + name, ev);
          });
        });

        // Support autofocus attribute
        $modal.on('shown', function(ev) {
          $('input[autofocus], textarea[autofocus]', $modal).first().trigger('focus');
        });
        // Auto-remove $modal created via service
        $modal.on('hidden', function(ev) {
          if(!options.persist) scope.$destroy();
        });

        // Garbage collection
        scope.$on('$destroy', function() {
          $modal.remove();
        });

        $modal.modal(options);

        return $modal;

      });

    }

    return new Modal(config);

  };

  return ModalFactory;

}]);

$strap.directive('bsModal', [
  '$q',
  '$modal',
  function($q, $modal) {

  return {
    restrict: 'A',
    scope: true,
    link: function postLink(scope, iElement, iAttrs, controller) {

      var options = {
        template: scope.$eval(iAttrs.bsModal),
        persist: true,
        show: false,
        scope: scope
      };

      // $.fn.datepicker options
      angular.forEach(['modalClass', 'backdrop', 'keyboard'], function(key) {
        if(angular.isDefined(iAttrs[key])) options[key] = iAttrs[key];
      });

      $q.when($modal(options)).then(function onSuccess(modal) {
        iElement.attr('data-target', '#' + modal.attr('id')).attr('data-toggle', 'modal');
        // iElement.on('click',function(){
        //   $('#' + modal.attr('id')).modal();
        // })
      });

    }
  };
}]);

$strap.directive('bsButtonsRadio', [
  '$timeout',
  function($timeout) {

  return {
    restrict: 'A',
    require: '?ngModel',
    compile: function compile(tElement, tAttrs, transclude) {

      tElement.attr('data-toggle', 'buttons-radio');

      // Delegate to children ngModel
      if(!tAttrs.ngModel) {
        tElement.find('a, button').each(function(k, v) {
          $(v).attr('bs-button', '');
        });
      }

      return function postLink(scope, iElement, iAttrs, controller) {

        // If we have a controller (i.e. ngModelController) then wire it up
        if(controller) {

          $timeout(function() {
            iElement
              .find('[value]').button()
              .filter('[value="' + controller.$viewValue + '"]')
              .addClass('active');
          });

          iElement.on('click.button.data-api', function (ev) {
            scope.$apply(function () {
              controller.$setViewValue($(ev.target).closest('button').attr('value'));
            });
          });

          // Watch model for changes
          scope.$watch(iAttrs.ngModel, function(newValue, oldValue) {
            if(newValue !== oldValue) {
              var $btn = iElement.find('[value="' + scope.$eval(iAttrs.ngModel) + '"]');
              if($btn.length) {
                $btn.button('toggle');
                // $.fn.button.Constructor.prototype.toggle.call($btn.data('button'));
              }
            }
          });

        }

      };
    }
  };
}]);

$strap.directive('bsTabs', [
  '$parse',
  '$compile',
  '$timeout',
  function ($parse, $compile, $timeout) {
    var template = '<div class="tabs">' + '<ul class="nav nav-tabs nav-justified">' + '<li ng-repeat="pane in panes" ng-class="{active:pane.active}">' + '<a data-target="#{{pane.id}}" data-index="{{$index}}" data-toggle="tab">{{pane.title}}</a>' + '</li>' + '</ul>' + '<div class="tab-content" ng-transclude>' + '</div>';
    return {
      restrict: 'A',
      require: '?ngModel',
      priority: 0,
      scope: true,
      template: template,
      replace: true,
      transclude: true,
      compile: function compile(tElement, tAttrs, transclude) {
        return function postLink(scope, iElement, iAttrs, controller) {
          var getter = $parse(iAttrs.bsTabs), setter = getter.assign, value = getter(scope);
          scope.panes = [];
          var $tabs = iElement.find('ul.nav-tabs');
          var $panes = iElement.find('div.tab-content');
          var activeTab = 0, id, title, active;
          $timeout(function () {
            $panes.find('[data-title], [data-tab]').each(function (index) {
              var $this = angular.element(this);
              id = 'tab-' + scope.$id + '-' + index;
              title = $this.data('title') || $this.data('tab');
              active = !active && $this.hasClass('active');
              $this.attr('id', id).addClass('tab-pane');
              if (iAttrs.fade)
                $this.addClass('fade');
              scope.panes.push({
                id: id,
                title: title,
                content: this.innerHTML,
                active: active
              });
            });
            if (scope.panes.length && !active) {
              $panes.find('.tab-pane:first-child').addClass('active' + (iAttrs.fade ? ' in' : ''));
              scope.panes[0].active = true;
            }
          });
          if (controller) {
            iElement.on('show', function (ev) {
              var $target = $(ev.target);
              scope.$apply(function () {
                controller.$setViewValue($target.data('index'));
              });
            });
            scope.$watch(iAttrs.ngModel, function (newValue, oldValue) {
              if (angular.isUndefined(newValue))
                return;
              activeTab = newValue;
              setTimeout(function () {
                var $next = $($tabs[0].querySelectorAll('li')[newValue * 1]);
                if (!$next.hasClass('active')) {
                  $next.children('a').tab('show');
                }
              });
            });
          }
        };
      }
    };
  }
]);

})(window.angular);
