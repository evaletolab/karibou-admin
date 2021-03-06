;(function(angular) {'use strict';

//
// Define the Order module (app.order)  for controllers, services and models
angular.module('app.order.admin', [
  'app.order.ui',
  'app.order.common',
  'app.order.manager',
  'app.order.shopper',
  'app.order.repport',
]).config(orderConfig);

//
// define all routes for user api
orderConfig.$inject=['$routeProvider','$locationProvider','$httpProvider'];
function orderConfig($routeProvider,$locationProvider,$httpProvider) {
  // List of routes of the application
  $routeProvider
    .when('/logistic/collect', {title:'welcome to your open community market',  templateUrl : '/partials/logistic/collect.html'})
    .when('/logistic/livraison', {title:'welcome to your open community market',  templateUrl : '/partials/logistic/overview.html'})
    .when('/order', {title:'Valider votre commande', templateUrl : '/partials/order/order.html'})
    .when('/order/:process', {title:'Bank feedback', templateUrl : '/partials/order/order.html'})
    .when('/admin/orders/:s?', {title:'Manage next orders ',  templateUrl : '/partials/dashboard/dashboard-admin.html'})
    .when('/admin/products', {title:'Manage next orders ',  templateUrl : '/partials/dashboard/dashboard-product.html'})
    .when('/admin/invoice', {title:'Manage next orders ',  templateUrl : '/partials/dashboard/dashboard-invoice.html'}) 
    .when('/admin/collect', {title:'Manage next orders ',  templateUrl : '/partials/dashboard/dashboard-collect.html'}) 
    .when('/admin/collect/map', {title:'Manage next orders ',  templateUrl : '/partials/dashboard/dashboard-collect-map.html'}) 
    .when('/admin/repport/shop', {title:'Activity report for shops ',  templateUrl : '/partials/dashboard/dashboard-repport-shop.html'}) 
    .when('/admin/config', {title:'Configuration ', templateUrl : '/partials/dashboard/dashboard-config.html'})
    .when('/admin/activities', {title:'Configuration ', templateUrl : '/partials/dashboard/dashboard-activity.html'})
    .when('/admin/shipping', {title:'Manage next shipping ',  templateUrl : '/partials/dashboard/dashboard-shopper.html'});
}


})(window.angular);
