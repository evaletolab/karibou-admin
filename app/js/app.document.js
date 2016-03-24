;(function(angular) {'use strict';

//
// Define the Document module (app.document)  for controllers, services and models
// the app.document module depend on app.config and take resources in document/*.html 
angular.module('app.document', ['app.config','app.document.ui'])
  .config(docConfig)
  .controller('DocumentCtrl',docCtrl)
  .factory('documents',docFactory);


//
// define all routes for user api
docConfig.$inject=['$routeProvider','$locationProvider','$httpProvider'];
function docConfig($routeProvider, $locationProvider, $httpProvider){

  // List of routes of the application
  $routeProvider
    .when('/content/create', {
        title:'Créer un nouveau document ',controller:'DocumentCtrl', templateUrl : '/partials/document/document-create.html'
     })
    .when('/account/documents', {
        title:'Les documents ',  templateUrl : '/partials/document/documents.html'
    })
    .when('/content/category/:category', {
        title:'Les documents ',  templateUrl : '/partials/document/documents-category.html'
    })
    .when('/content/:slug/edit', {
        title:'Votre document ', controller:'DocumentCtrl', templateUrl : '/partials/document/document-create.html'
     })
    .when('/content/:slug', {
        controller:'DocumentCtrl', templateUrl : '/partials/document/document.html'
     });
}

//
// implement controller
docCtrl.$inject=['$scope','$rootScope','$routeParams','config','documents','feedback','user'];
function docCtrl($scope,$rootScope, $routeParams, config, doc, feedback,user) {
  //
  // init context
  $scope.doc=doc;
  
  $scope.defaultLabel={
    'recipe':'recette',
    'post':'publication',
    'bundle':'panier',
    'page':'page'
  };

  $scope.defaultTitle={
    'recipe':'Les recettes',
    'post':'Les publications',
    'bundle':'Les paniers',
    'page':'Les pages'
  };


  //
  // current category
  $scope.type=$routeParams.category;

  config.shop.then(function () {
    $scope.types=config.shop.document.types;
  });

  user.$promise.then(function () {
    user.documents=doc.my().models;
  });

  var api=$scope.api;

  $scope.isOwnerOrAdmin=function (doc) {
    return user.id===doc.owner||user.isAdmin();
  };

  $scope.save=function(){
    $rootScope.WaitText="Waiting ...";
    var d=doc.model;
    delete d.products;
    doc.save(d).$promise.then(function(s){
      api.info($scope,"Votre document a été enregistré!",2000, function(){
      });
    });
  };
  
  
  $scope.create=function(){
    $rootScope.WaitText="Waiting ...";
    doc.create().model.$promise.then(function(){
    });
    
  };

  $scope.remove=function(doc,password){
    doc.remove(password,function(){
        $location.path("/content");
        $scope.doc={};
    });
    
  };

  $scope.removeSku=function (sku) {
      var idx=doc.model.skus.indexOf(sku);
      if(idx>-1){
        doc.model.skus.splice(idx,1);
        doc.save(doc.model);
      }
  };
  

  $scope.findOneDocument=function () {
    if(!$routeParams.slug || !$routeParams.slug.length){
      return doc.clear();
    }

    doc.get($routeParams.slug).model.$promise.then(function(){
      $rootScope.title=doc.model.title[$scope.locale()];
      $scope.docs=doc.findByCategory(doc.model.type).models;      

    });
  };
  
  //
  // load docs from user.id, or/and category
  $scope.findDocuments=function (options) {
    options=options||_.extend({},$routeParams);
    if(options.skus){
      $scope.docs=doc.findBySkus(options.skus).models;
    }
    if(options.category){
      $scope.docs=doc.findByCategory(options.category).models;      
    }

  };
   
}




/**
 * app.document provides a model for interacting with Document.
 * This service serves as a convenient wrapper for other related services.
 */
docFactory.$inject=['config','$resource','$q','$rootScope','api','user'];
function docFactory(config, $resource, $q,$rootScope, api,user) {
  var _documents;


  var defaultDocument = {
    title:{fr:'Titre'},
    header:{fr:'En tête'},
    content:{fr:'Contenu'},
    photo:{
      bundle:[]
    },
    available:false,
    published:false,
    skus:[],
    style:undefined,
    type: undefined
  };

  //
  // fetch user info trigger  
  $rootScope.$on("user.init",function(){
    defaultDocument.signature=user.display();
    user.documents=_documents.my().models;
  });      


  
  //
  // this is the restfull backend for angular 
  // - /v1/documents/skus/:skus
  // - /v1/documents/category/:category
  // - /v1/documents/:slug
  // - /v1/documents'
  var backend={  
    documents:$resource(config.API_SERVER+'/v1/documents/:slug/:param',
      {slug:'@slug'}, {
      findBySkus:{method:'GET',isArray:true,params:{slug:'skus'}},
      findByCategory:{method:'GET',isArray:true,params:{slug:'category'}},
      get:{method:'GET',isArray:false},
      update: {method:'POST'},
      delete: {method:'PUT'},
    })
  };

  var Document = function(data) {
    this.model={};
    this.models=[];
    angular.extend(this.model, defaultDocument, data);

    //
    // wrap promise to this object
    this.$promise=$q.when(this);

  };


  Document.prototype.getCategories = function() {
    return config.shop.document.types;
  };

  Document.prototype.clear = function() {
    this.model={};
    angular.extend(this.model, defaultDocument,{signature:user.display()});
    return this;
  };

  Document.prototype.clearAll = function() {
    this.models=[];
    return this;
  };

  //
  // REST api wrapper
  //
  
  Document.prototype.findBySkus = function(skus) {
    this.models=backend.documents.findBySkus({skus:skus});
    return this;
  };

  Document.prototype.my = function() {
    this.models=backend.documents.query();
    return this;
  };


  Document.prototype.findByCategory = function(cat) {
    this.models=backend.documents.findByCategory({param:cat});
    return this;
  };


  Document.prototype.get = function(slug) {
    this.model=backend.documents.get({slug:slug});
    this.model.$promise.then(function (d) {
      $rootScope.$broadcast("product.wrap",d.products);
    })
    return this;
  };


  Document.prototype.save = function(doc){
    if(!doc){
      this.model.skus=_.uniq(this.model.skus);
      this.model.$save();
      return this;
    }
    this.model=backend.documents.save({slug:doc.slug[0]},doc);
    return this;
  };

  Document.prototype.create=function(){
    this.model=backend.documents.save(this.model);
    return this;
  };    
  
  Document.prototype.remove=function(password,cb,err){
    this.model=this.model.$delete({password:password});
    return this;
  };    
 
  _documents=new Document();  
  return _documents;
}



})(window.angular);
