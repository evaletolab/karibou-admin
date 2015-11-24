;(function(angular) {'use strict';

//
// Define the Order module (app.order)  for controllers, services and models
angular.module('app.order', [
  'app.order.ui',
  'app.order.common',
  'app.order.widget',
  'app.order.new',
  'postfinance.card'
]).config(orderConfig);

//
// define all routes for user api
orderConfig.$inject=['$routeProvider','$locationProvider','$httpProvider'];
function orderConfig($routeProvider,$locationProvider,$httpProvider) {
  // List of routes of the application
  $routeProvider
    .when('/order', {title:'Valider votre commande', templateUrl : '/partials/order/order.html'})
    .when('/order/:process', {title:'Bank feedback', templateUrl : '/partials/order/order.html'})
    .when('/admin/orders/:s?', {title:'Manage next orders ',  templateUrl : '/partials/dashboard/dashboard-admin.html'});
}


})(window.angular);
