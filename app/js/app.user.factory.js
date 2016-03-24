;(function(angular) {'use strict';

//
// Define the User module (app.user)  for controllers, services and models
// the app.user module depend on app.config and take resources in account/*.html
angular.module('app.user')
  .factory('user',userFactory);;

//
// define dependency injection and implement servie
userFactory.$inject=['config','$location','$rootScope','$route','$resource','$log','$q','api','shop','Map'];
function userFactory(config, $location, $rootScope, $route, $resource, $log, $q, api, shop, Map) {
  var defaultUser = {
    id: '',
    name: {
      givenName: '',
      familyName: '',
    },
    photo:config.user.photo,
    email: {},
    reminder:{weekdays:[]},
    roles: [],
    shops: [],
    provider: '',
    url: '',
    phoneNumbers:[{what:'mobile'}],
    addresses:[]
  };

  var backend={};
  backend.$user=$resource(config.API_SERVER+'/v1/users/:id/:action/:aid/:detail',
          {id:'@id',action:'@action',aid:'@aid',detail:'@detail'}, {
          update: {method:'POST'},
          delete: {method:'PUT'},
  });


  var User = function(data) {

    //
    // wrap promise to this object
    this.$promise=$q.when(this);
  };


  User.prototype.display=function(){
      if (this.displayName){
        return this.displayName;
      }
      if (this.name && (this.name.givenName || this.name.familyName)) {
        return this.name.givenName+' '+this.name.familyName;
      }
      if (this.id){
        return this.id+'@'+this.provider;
      }

      return 'Anonymous';
  };


  User.prototype.loggedTime=function () {
    var time=(Date.now()-(new Date(this.logged)).getTime())/1000;
    return parseInt(time);
  };


  User.prototype.acronym=function(){
    var d=this.display();
    res=d.match(/\b(\w)/g).join('');
    return (d)?d:'unknow';
  };


  User.prototype.isOwner=function(shopname){

      //if (this.isAdmin())return true;
      for (var i in this.shops) {
        if (this.shops[i].name === shopname) {
          return true;
        }
      }
      return false;
  };

  User.prototype.isOwnerOrAdmin=function(shopname){
    if(this.isAdmin())
      return true;
    return this.isOwner(shopname);
  };

  User.prototype.isAuthenticated= function () {
      return this.id !== '';
  };

  User.prototype.isAdmin= function () {
    return this.hasRole('admin');
  };

  User.prototype.isReady=function(){
    return (this.email&&this.email.status === true);
  };

  User.prototype.hasRole= function (role) {
      for (var i in this.roles){
        if (this.roles[i]===role) return true;
      }
      return false;
  };

  User.prototype.hasLike= function (product) {
      if(this.likes&&this.likes.length){
        if(this.likes.indexOf(product.sku)!==-1){
          return true;
        }
      }
      // for (var i in this.likes){
      //   if (this.likes[i]==product.sku) return true;
      // }
      return false;
  };

  User.prototype.hasPrimaryAddress= function () {
      if (this.addresses&&this.addresses.length==1)return 0;
      for (var i in this.addresses){
        if (this.addresses[i].primary===true)
          return i;
      }
      return false;
  };


  User.prototype.getEmailStatus=function(){
    if(!this.email||!this.email.status)
      return false;

    if(this.email.status===true)
      return true;

    return  moment(this.email.status).format('ddd DD MMM YYYY', 'fr');

  };

  User.prototype.populateAdresseName=function(user){
    if (!user)user=this;
    // autofill the address name when available
    if(user.addresses&&user.addresses.length&&!user.addresses[0].name){
      user.addresses[0].name=user.name.familyName+' '+user.name.givenName;
    }
  };

  User.prototype.getBVR=function(){
    var self=this;
    
  };

  //
  // init user 
  User.prototype.init=function () {
    var self=this;

    // set context for error
    if(window.Raven){
      Raven.setUserContext({id:self.id,email:self.email});        
    }

    if(!self.addresses){
      return;
    }
    //check address
    self.populateAdresseName();

    // get geo 
    self.geo=new Map();
    self.addresses.forEach(function(address,i){
      // address is correct
      if(!address.geo||!address.geo.lat||!address.geo.lng){
        return;
      }
      //
      //setup marker
      self.geo.addMarker(i,{
        lat:address.geo.lat,
        lng:address.geo.lng,
        message:address.streetAdress+'/'+address.postalCode
      });
    });

  };

  //
  // REST api wrapper
  //

  User.prototype.me = function(cb) {
    var self=this;
    return this.chain(backend.$user.get({id:'me'}, function(_u,headers) {
        self.wrap(_u);
        self.shops=shop.wrapArray(self.shops);

        //
        // init
        self.init();

        //
        // broadcast info
        $rootScope.$broadcast("user.init",self);

        if(cb)cb(self);
        return self;
      },function (error) {
      if([0,401].indexOf(error.status)!==-1){
        self.copy(defaultUser);
      }
    }).$promise
    );
  };


  User.prototype.updateGeoCode=function () {
    var promises=[], dirty=false, self=this;
    // check state
    if(self.geo){
      return;
    }
    if(self.addresses.length===0||self.addresses.length && self.addresses[0].geo && self.addresses[0].geo.lat){
      return;
    }

    //
    // get geo lt/lng
    if(!self.geo)self.geo=new Map();


    self.addresses.forEach(function(address,i){
      // address is correct
      if(address.geo&&address.geo.lat&&address.geo.lng){
        return;
      }

      promises.push(self.geo.geocode(address.streetAdress, address.postalCode, address.country, function(geo){
        if(!geo.results.length||!geo.results[0].geometry){
         return;
        }
        if(!geo.results[0].geometry.lat){
          return;
        }

        //
        //update data
        address.geo={};
        address.geo.lat=geo.results[0].geometry.location.lat;
        address.geo.lng=geo.results[0].geometry.location.lng;

        //
        //setup marker
        self.geo.addMarker(i,{
          lat:address.geo.lat,
          lng:address.geo.lng,
          message:address.streetAdress+'/'+address.postalCode
        });


        dirty=true;
      }));// end of promise
    }); // end of forEach

    // should we save the user?
    $q.all(promises).finally(function () {
      $log('save user geo map',dirty);
      if(dirty)self.save();
    });


  };


  User.prototype.query = function(filter) {
    self=this;
    return this.chainAll(backend.$user.query(filter||{}).$promise);
  };

  User.prototype.validate = function(validation, cb) {
    var msg=$resource(config.API_SERVER+'/v1/validate/:id/:email',validation).get( function() {
      if(cb)cb(msg);
    });
    return;
  };

  User.prototype.validateEmail = function( cb){
    var validate=$resource(config.API_SERVER+'/v1/validate/create').save(function() {
      if(cb)cb(validate);
    });
    return validate;
  };

  User.prototype.recover = function(recover, cb){
    var d=$resource(config.API_SERVER+'/v1/recover/:token/:email/password',recover).save(function() {
      if(cb)cb(d);
    });
    return d;
  };


  User.prototype.save = function(user, cb){
    // autofill the address name when available
    this.populateAdresseName(user);

    var u=backend.$user.save(user, function() {
      //
      // only same user should be sync
      if(u.id===_user.id){
        _user.copy(u);
      }
      $rootScope.$broadcast("user.update",self);

      if(cb)cb(_user);
    });
    return _user;
  };

  User.prototype.logout=function(cb){
    var self=this;
    var u = $resource(config.API_SERVER+'/logout').get( function() {
      self.copy(defaultUser);
      $rootScope.$broadcast("user.init",self);
      if(cb)cb(self);
    });
    return u;
  };

  User.prototype.register=function (user, cb){

    // FIXME autofill the address name when available
    this.populateAdresseName(user);
    var u = $resource(config.API_SERVER+'/register').save(user, function() {
      _user.copy(u);
      _user.updateGeoCode();


      if(cb)cb(_user);
    });
    return u;
  };

  User.prototype.newpassword=function (change, cb){
    var _user=this, u = backend.$user.save({id:this.id,action:'password'},change, function() {
      if(cb)cb(_user);
    });
    return u;
  };

  User.prototype.login=function (data, cb){
    var self=this, u = $resource(config.API_SERVER+'/login').save(data, function() {
      _user.copy(u);
      _user.updateGeoCode();
      $rootScope.$broadcast("user.init",self);
      if(cb)cb(_user);
    });
    return u;
  };

  //
  // TODO move this action to the shop service
  User.prototype.createShop=function(shop,cb){
    var s = $resource(config.API_SERVER+'/v1/shops').save(shop, function() {
      _user.shops.push(s);
      if(cb)cb(_user);
    });
    return s;
  };

  User.prototype.remove=function(password,cb){
    var self=this, u=backend.$user.delete({id:this.id},{password:password}, function() {
      self.delete();
      $rootScope.$broadcast("user.remove",self);
      cb();
    });
  };


  User.prototype.love=function(product,cb){
    var self=this, params={};
    var u = backend.$user.save({id:this.id,action:'like',aid:product.sku}, function() {
      self.copy(u);

      $rootScope.$broadcast("user.update.love",self);

      if(cb)cb(self);
    });
    return this;
  };


  /**
   * payment methods
   */
  User.prototype.checkPaymentMethod=function(cb){
    var self=this, allAlias=[],alias;
    if(!self.payments || !self.payments.length){
      return cb({});
    }
    allAlias=self.payments.map(function (payment) {
      return payment.alias;
    });
    alias=allAlias.pop();
    backend.$user.save({id:this.id,action:'payment',aid:alias,detail:'check'},{alias:allAlias}, function(methodStatus) {
      if(cb)cb(methodStatus);
    },function (error) {
      if([0,401].indexOf(error.status)!==-1){
        self.copy(defaultUser);
      }
    });
    return this;
  };

  User.prototype.addPaymentMethod=function(payment,uid, cb){
    var self=this, params={};
    // 
    // we can now update different user
    if(cb===undefined){cb=uid;uid=this.id;}
    if(uid===undefined) uid=this.id;
    backend.$user.save({id:uid,action:'payment'},payment, function(u) {
      self.payments=u.payments;
      if(cb)cb(self);
    });
    return this;
  };

  User.prototype.deletePaymentMethod=function(alias,uid,cb){
    var self=this, params={};
    // 
    // we can now update different user
    if(cb===undefined){cb=uid;uid=self.id;}
    if(uid===undefined) uid=this.id;
    backend.$user.save({id:uid,action:'payment',aid:alias,detail:'delete'}, function() {
      for(var p in self.payments){
        if(self.payments[p].alias===alias){
          self.payments.splice(p,1);
        }
      }
      $rootScope.$broadcast("user.update.payment");
      if(cb)cb(self);
    });
    return this;
  };

  User.prototype.pspForm=function(cb){
    var self=this, params={};
    backend.$user.get({id:this.id,action:'psp'}, function(form) {
      self.ecommerceForm=form;
      if(cb)cb(self);
    });
    return this;
  };


  /**
   * ADMIN
   */
  User.prototype.updateStatus=function(id,status,cb){
    var self=this, params={};
    var u = backend.$user.save({id:id,action:'status'},{status:status}, function() {
      self.copy(u);
      if(cb)cb(self);
    },err);
    return this;
  };

   



  //
  //default singleton for user
  var _user=api.wrapDomain(User,'id', defaultUser);
  return _user;
}


})(window.angular);
