;(function(angular) {'use strict';

//
// Define the Category module (app.shop)  for controllers, services and models
// the app.shop module depend on app.config and take resources in shop/*.html 
angular.module('app.category', ['app.config', 'app.api','$strap'])
  .config(categoryConfig)
  .controller('CategoryCtrl',CategoryCtrl)
  .factory('category', categoryService);

//
// define all routes for user api
categoryConfig.$inject=['$routeProvider','$locationProvider','$httpProvider'];
function categoryConfig($routeProvider, $locationProvider, $httpProvider) {

  // List of routes of the application
  $routeProvider
    .when('/admin/category', {title:'Admin of category ', _view:'main', templateUrl : '/partials/admin/dashboard-category.html'});
}



//
// Define the application level controllers
// the CategoryCtrl is used in shop/*.html 
CategoryCtrl.$inject=['config','$scope','$timeout','$routeParams','$location','api','category','$resource'];
function CategoryCtrl(config, $scope, $timeout, $routeParams, $location, api, category,$resource) {

  $scope.config=config;

  $scope.selected=false;
  $scope.category=category;
  
  $scope.selectCategory=function(e,v){
    if(!$scope.categoryslug){return;}
    category.get($scope.categoryslug,function(c){
      $scope.selected=c;        
    });
  };

  $scope.save=function(category){
    category.save(function(s){
        api.info($scope,"Successfully updated!");
        $scope.categoryslug=null;
    });
  };
  
  $scope.create=function(cat){
    category.create(cat,function(s){
        api.info($scope,"Successfully updated!");
        $scope.categories.push(s);
    });
  };

  $scope.delete=function(index, password){
    var category=$scope.categories[index];

    
    category.remove(password, function(s){
        api.info($scope,"Successfully updated!");
        $scope.categories.splice(index,1);
    });
  };

  //
  //modal

  // default model
  $scope.modal = {name:'',type:'Category',image:'fa fa-leaf', weight:0, saved: false};

  
  $scope.launchModal=function(elem){
    angular.extend($scope.modal,$scope.categories[elem],{index:elem});
  };
  
  $scope.modalDissmiss=function(){
    $scope.modal = {name:'',type:'Category',image:'fa fa-leaf', weight:0, saved: false};
  };

  $scope.modalSave=function(dismiss){
    //
    // check if data are correct
    if($scope.modal.index){
      angular.extend($scope.categories[$scope.modal.index],$scope.modal);
      $scope.save($scope.categories[$scope.modal.index]);
      $scope.modalDissmiss();
      return;
    }
  };

  $scope.modalAdd=function(dismiss){
    //
    // check if data are correct
    $scope.create($scope.modal);
    $scope.modalDissmiss();
  };
  
  //
  // upload foreground photo 
  // $scope.uploadCover=function(cat){
  //   api.uploadfile($scope, {},function(err,fpfile){
  //     if(err){
  //       api.info($scope,"l'opération à été anullé");
  //       return false;
  //     }
  //     $timeout(function() {
  //       cat.cover=(config.storage&&fpfile.key)?config.storage+fpfile.key:fpfile.url;
  //     }, 0);
      
  //   });
  // };    
  
  // init
  category.select({stats:true},function(categories){
    $scope.categories=categories;
  });
  
}  




/**
 * app.shop provides a model for interacting with Category.
 * This service serves as a convenient wrapper for other related services.
 */

categoryService.$inject=['config','$location','$rootScope','$routeParams','$resource','api'];
function categoryService(config, $location, $rootScope, $routeParams,$resource, api) {

  var defaultCategory = {
    name:'',
    weight:0,
    description:"",
    group:""
  };
  
  //
  // default behavior on error
  var onerr=function(data,config){
    _category.copy(defaultCategory);
  };


  var Category = function(data) {
    //
    // this is the restfull backend for angular 
    this.backend=$resource(config.API_SERVER+'/v1/category/:category',
          {category:'@id'}, {
          update: {method:'POST'},
          delete: {method:'PUT'},
    });
    angular.extend(this, defaultCategory, data);
  };

  Category.prototype.getCurrent = function(){
    if(!$routeParams.category)
      {return;}
    return this.find({slug:$routeParams.category});
  };
  

  Category.prototype.findNameBySlug = function(slug){
    var cat=this.find({slug:slug});
    if (cat) {return cat.name;} else {return "Inconnu";}      
  };

  Category.prototype.findBySlug = function(slug){
    return this.find({slug:slug});
  };

  Category.prototype.select = function(filter,cb,err) {
    if(!err){ err=onerr;}
    var categories=[];
    var c=this.backend.query(filter, function() {
      categories=Category.load(c);
      if(cb){cb(categories);}
    },err);
    return categories;
  };


  Category.prototype.get = function(slug,cb,err) {
    if(!err) {err=onerr;}
    var loaded=Category.find({slug:slug});if (loaded){
      if(cb){cb(loaded);}
      return loaded;
    }
    
    var category=this, c=this.backend.get({category:slug},function() {
      category.wrap(s);
      if(cb){cb(category);}
    },err);
    return category;
  };


  Category.prototype.save = function(cb, err){
    //console.log("model",this.photo)

    if(!err){ err=onerr;}
    var category=this, s=this.backend.save({category:this.slug},this, function() {
      category.wrap(s);
      if(cb){cb(category);}
    },err);
    return category;
  };

  Category.prototype.create=function(cat, cb,err){
    if(!err) {err=function(){};}
    var category=this, s = this.backend.save(cat, function() {
      category=category.wrap(s);
      if(cb){cb(category);}
    },err);
    return category;
  };    
  
  Category.prototype.remove=function(password, cb,err){
    if(!err) {err=function(){};}
    var category=this, s = this.backend.delete({category:this.slug},{password:password},function() {
      if(cb){cb(category);}
    },err);
    return category;
  };    
 
  var _category=api.wrapDomain(Category,'slug', defaultCategory);  
  return _category;
}

})(window.angular);
