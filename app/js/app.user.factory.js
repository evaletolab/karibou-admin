;(function(angular) {'use strict';

//
// Define the User module (app.user)  for controllers, services and models
// the app.user module depend on app.config and take resources in account/*.html
var User=angular.module('app.user');



/**
 * app.user provides a model for interacting with user.
 * This service serves as a convenient wrapper for other related services.
 */

User.factory('user', [
  'config',
  '$location',
  '$rootScope',
  '$route',
  '$resource',
  '$q',
  'api',
  'shop',

  function (config, $location, $rootScope, $route, $resource, $q, api, shop) {

    var defaultUser = {
      id: '',
      name: {
        givenName: '',
        familyName: '',
      },
      photo:config.user.photo,
      email: {},
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
      this.$promise=$q.when(this)
    }


    User.prototype.display=function(){
        if (this.name && (this.name.givenName || this.name.familyName)) {
          return this.name.givenName+' '+this.name.familyName
        }
        if (this.displayName)return this.displayName;
        if (this.id){
          return this.id+'@'+this.provider;
        }

        return 'Anonymous';
    }


    User.prototype.loggedTime=function () {
      var time=(Date.now()-(new Date(this.logged)).getTime())/1000;
      return parseInt(time)
    }


    User.prototype.acronym=function(){
      var d=this.display()
      res=d.match(/\b(\w)/g).join('')
      return (d)?d:'unknow';
    }


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
      return (this.email&&this.email.status == true)
    }

    User.prototype.hasRole= function (role) {
        for (var i in this.roles){
          if (this.roles[i]===role) return true;
        }
        return false;
    };

    User.prototype.hasLike= function (product) {
        for (var i in this.likes){
          if (this.likes[i].sku==product.sku) return true;
        }
        return false;
    };

    User.prototype.hasPrimaryAddress= function () {
        if (this.addresses&&this.addresses.length==1)return true;
        for (var i in this.addresses){
          if (this.addresses[i].primary===true)
            return i;
        }
        return false;
    }


    User.prototype.getEmailStatus=function(){
      if(!this.email||!this.email.status)
        return false;

      if(this.email.status===true)
        return true;

      return  moment(this.email.status).format('ddd DD MMM YYYY', 'fr');

    }

    User.prototype.populateAdresseName=function(user){
      if (!user)user=this;
      // autofill the address name when available
      if(user.addresses&&user.addresses.length&&!user.addresses[0].name){
        user.addresses[0].name=user.name.familyName+' '+user.name.givenName
      }
    }

    //
    // REST api wrapper
    //

    User.prototype.me = function(cb) {
      var self=this;
      return this.chain(backend.$user.get({id:'me'}, function(_u,headers) {
          self.wrap(_u);
          self.shops=shop.wrapArray(self.shops);
          if(cb)cb(self);
          return self;
        }).$promise
      );
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
      this.populateAdresseName(user)

      var u=backend.$user.save(user, function() {
        _user.copy(u);
        if(cb)cb(_user);
      });
      return u;
    };

    User.prototype.logout=function(cb){
      var u = $resource(config.API_SERVER+'/logout').get( function() {
        _user.copy(defaultUser);
        if(cb)cb(_user);
      });
      return u;
    };

    User.prototype.register=function (user, cb){

      // FIXME autofill the address name when available
      this.populateAdresseName(user)
      var u = $resource(config.API_SERVER+'/register').save(user, function() {
        _user.copy(u);


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
      var u = $resource(config.API_SERVER+'/login').save(data, function() {
        _user.copy(u);
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
        self.delete()
        cb()
      });
    }


    User.prototype.love=function(product,cb){
      var self=this, params={};
      var u = backend.$user.save({id:this.id,action:'like',aid:product.sku}, function() {
        self.copy(u);
        if(cb)cb(self);
      });
      return this;
    };


    /**
     * payment methods
     */
    User.prototype.addPaymentMethod=function(payment,cb){
      var self=this, params={};
      backend.$user.save({id:this.id,action:'payment'},payment, function(u) {
        self.payments=u.payments
        if(cb)cb(self);
      });
      return this;
    };

    User.prototype.deletePaymentMethod=function(alias,cb){
      var self=this, params={};
      backend.$user.save({id:this.id,action:'payment',aid:alias,detail:'delete'}, function() {
        for(var p in self.payments){
          if(self.payments[p].alias===alias){
            self.payments.splice(p,1)
          }
        }
        if(cb)cb(self);
      });
      return this;
    };

    User.prototype.pspForm=function(cb){
      var self=this, params={};
      backend.$user.get({id:this.id,action:'psp'}, function(form) {
        self.ecommerceForm=form
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
]);

})(window.angular);
