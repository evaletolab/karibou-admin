;(function(angular) {'use strict';

/**
 * @ngdoc directive
 * @name angular-uploadcare.directive:Uploadcare
 * @description Provides a directive for the Uploadcare widget.
 * # Uploadcare
 * # see https://uploadcare.com/cookbook/validation/
 */
angular.module('app.uploadcare', [])
  .directive('uploadcareWidget', uploadcareWidget);

uploadcareWidget.$inject=['config', '$parse','$timeout','$log'];
function uploadcareWidget(config, $parse, $timeout, $log) {
  return {
    restrict: 'E',
    replace: true,
    require: 'ngModel',
    template: '<input type="hidden" role="ng-uploadcare-uploader" />',
    scope: {
      onWidgetReady: '&',
      onUploadComplete: '&',
      onUploadError: '&',
      onChange: '&',
    },
    link:function($scope, $element, $attrs) {
      if(!uploadcare) {
        $log.error('Uploadcare script has not been loaded!.');
        return;
      }
      // uploadcare.openDialog(null, {
      //     publicKey: config.uploadcare,
      // });      
      config.shop.then(function () {

        $scope.widget = uploadcare.Widget($element);
        $scope.widget.validators.push(function(fileInfo) {
          if (fileInfo.size !== null && fileInfo.size > 150 * 1024) {
            $scope.onUploadError({error: "La taille maximum d'une image est limitée à 150kb"});
            throw new Error("fileMaximumSize");
          }
        });      
        // $scope.onWidgetReady({widget: $scope.widget});
        $scope.widget.onUploadComplete(function(info) {
          $scope.onUploadComplete({info: info});
        });
        $scope.widget.onChange(function(file) {
          if(file){
            file.done(function(fileInfo) {
              // $timeout(function() {
              //   $parse($attrs.ngModel).assign($scope.$parent, '//ucarecdn.com/'+fileInfo.uuid+'/');
              // },200)
              $timeout(function () {
                $parse($attrs.ngModel).assign($scope.$parent, '//ucarecdn.com/'+fileInfo.uuid+'/');
              },100);
            }).fail(function(error, fileInfo) {
              $log.error('Uploadcare upload error',error,fileInfo);
              // $scope.onUploadError({error: error});
            });        

          }

          // add data binding for hidden inputs
          $scope.onChange({file: file});
        });

      });

    }
  };
}


})(window.angular);
