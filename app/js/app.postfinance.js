;(function(angular) {'use strict';

/**
 * Angular.js module for postfinance
 */
angular.module('app.postfinance',['app.config'])
  .factory('card',cardFactory);


//
// define dependency injection
cardFactory.$inject=['config','$rootScope','$resource'];

//
// implement service
function cardFactory(config, $rootScope,$resource) {
  var defaultCardValues = {
    number: undefined,
    csc: undefined,
    year: undefined,
    month: undefined,
    firstName: '',
    lastName: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    custom: undefined
  };


  var Card = function(data) {
  }


  Card.prototype.clear=function(product){
  }

  return {};
}



})(window.angular);
