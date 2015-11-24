;(function(angular) {'use strict';

//
// Define the Document module (app.document)  for controllers, services and models
// the app.document module depend on app.config and take resources in document/*.html 
angular.module('app.document', ['app.config', 'app.api','app.ui','app.document.ui'])
  .config(docConfig)
  .controller('DocumentCtrl',docCtrl)
  .factory('document',docFactory);


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
docCtrl.$inject=[
  '$scope','$rootScope','$routeParams','config','document','product','feedback'
];

function docCtrl ($scope,$rootScope, $routeParams, config, document, product, feedback) {
  //
  // init context
  $scope.document=document;
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

  $scope.WaitText=true;

  //
  // current category
  $scope.type=$routeParams.category;

  //
  // init an empty list
  $scope.documents=[];
  
  config.shop.then(function () {
    $scope.types=config.shop.document.types;
  });

  var api=$scope.api, config=$scope.config, user=$scope.user;

  $scope.isOwnerOrAdmin=function (doc) {
    return user.id===doc.owner||user.isAdmin();
  }

  $scope.save=function(){
    $rootScope.WaitText="Waiting ...";
    document.save().$promise.then(function(s){
      api.info($scope,"Votre document a été enregistré!",2000, function(){
      });
    });
  };
  
  
  $scope.create=function(){
    $rootScope.WaitText="Waiting ...";
    document.create().model.$promise.then(function(){
    });
    
  };

  $scope.remove=function(document,password){
    document.remove(password,function(){
        $location.path("/content");
        $scope.document={};
    });
    
  };

  $scope.removeSku=function (sku) {
      var idx=document.model.skus.indexOf(sku);
      if(idx>-1){
        document.model.skus.splice(idx,1);
        document.save(this.model)
      }
  }
  

  $scope.findOneDocument=function () {
    if(!$routeParams.slug){
      document.clear();
      return;
    }
    document.get($routeParams.slug).model.$promise.then(function(){
      $rootScope.title='documents '+document.model.slug+' - '+document.model.title;
      if(document.model.products){
        document.model.products=product.wrapArray(document.model.products);
      }
    });
  }
  
  //
  // load docs from user.id, or/and category
  $scope.findDocuments=function (options) {
    options=options||_.extend({},$routeParams)
    if(options.skus){
      $scope.documents=document.findBySkus(options.skus).models;
    }
    if(options.category){
      $scope.documents=document.findByCategory(options.category).models;      
    }

  }
   
}




/**
 * app.document provides a model for interacting with Document.
 * This service serves as a convenient wrapper for other related services.
 */
docFactory.$inject=['config','$resource','$q','$rootScope','api','user'];
function docFactory (config, $resource, $q,$rootScope, api,user) {
  var _documents;


  var defaultDocument = {
    title:'Titre',
    header:'En tête',
    content:'Contenu',
    photo:{
      bundle:[]
    },
    available:false,
    published:false,
    skus:[],
    style:false,
    type: false
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
  }

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
    return this;
  };


  Document.prototype.save = function(doc){
    if(!doc){
      this.model.skus=_.uniq(this.model.skus);
      this.model.$save();
      return this;
    }
    doc.skus=_.uniq(doc.skus);
    this.model=backend.documents.save({slug:doc.slug},doc);
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
