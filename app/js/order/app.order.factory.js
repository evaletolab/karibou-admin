;(function(angular) {'use strict';

//
// Define the Order module (app.order)  for controllers, services and models
// the app.shop module depend on app.config and take resources in order/*.html
angular.module('app.order')
  .factory('order',orderFactory);


orderFactory.$inject=['config','$resource','$q','user','shop','api','cart'];
function orderFactory(config, $resource, $q, user,shop, api, cart) {

  var defaultOrder={
  };

  // define DAO
  var backend={};


  backend.$order=$resource(config.API_SERVER+'/v1/orders/:action/:id',
          {action:'@action',id:'@id'}, {
          update: {method:'POST'},
          collect:{method:'POST',isArray:true, headers:{}},
          delete: {method:'PUT'},
  });

  backend.$user=$resource(config.API_SERVER+'/v1/orders/users/:id',
          {id:'@id',action:'@action',aid:'@aid'}, {
          update: {method:'POST'},
          delete: {method:'PUT'},
  });

  backend.$repport=$resource(config.API_SERVER+'/v1/orders/invoices/shops/:month/:year',
          {month:'@month',year:'@year'}
  );



  var Order = function(data) {
    angular.extend(this, defaultOrder, data);


    // default data
    this.shipping={};
    this.items={};

    //
    // wrap promise to this object
    this.$promise=$q.when(this);

  };



  /* return array of one week of shipping days available for customers*/
  Order.prototype.findPastWeekOfShippingDay=function(when){
    // init the date at begin of the week
    var next=new Date(when.getTime()-(when.getDay()*86400000)), all=[], nextDate, nextDay;

    // jump one week past
    next=new Date(next.getTime()-86400000*7);

    config.shop.order.weekdays.forEach(function(day){
      nextDay=(day>=next.getDay())? (day-next.getDay()):(7-next.getDay()+day);
      nextDate=new Date(nextDay*86400000+next.getTime());
      if(config.shop.order.weekdays.indexOf(nextDate.getDay())!=-1)
        {all.push(nextDate);}

    });

    // sorting dates
    all=all.sort(function(a,b){
      return b.getTime() - a.getTime();
    });
    return all;
  };

  /* return array of one week of shipping days available for customers*/
  Order.prototype.findOneWeekOfShippingDay=function(timeLess, from){
    var next=this.findNextShippingDay(0,0,from), result=[], all=[next], today=new Date(), nextDate, nextDay;

    config.shop.order.weekdays.forEach(function(day){
      if(day==next.getDay()){
        return;
      }

      nextDay=(day>next.getDay())? (day-next.getDay()):(7-next.getDay()+day);
      nextDate=new Date(nextDay*86400000+next.getTime());
      
      if(Math.round((nextDate.getTime()-today.getTime())/86400000)>6)
        {return;}
      if(config.shop.order.weekdays.indexOf(nextDate.getDay())===-1)
        {return;}
      all.push(nextDate);

    });

    // sorting dates
    all=all.sort(function(a,b){
      // Turn your strings into dates, and then subtract them
      // to get a value that is either negative, positive, or zero.
      return a.getTime() - b.getTime();
    });

    //
    // construct object with delivery options
    var elem=0;
    all.forEach(function(next,idx){
      for(var k in config.shop.order.shippingtimes){

        next.setHours(k,0,0,0);
        result.push({id:elem++,when:new Date(next),time:config.shop.order.shippingtimes[k]});
        // we dont want shipping times precision
        if(timeLess) {return;}
      }
    });

    return result;

  };

  /* return the next shipping day available for customers*/
  Order.prototype.findNextShippingDay=function(tl,th,date){
    var now=date||new Date(), i, day,
        next, 
        timelimit=tl||config.shop.order.timelimit,
        timelimitH=th||config.shop.order.timelimitH;
    // 24h == 86400000

    // remove min/sec
    now.setHours(now.getHours(),0,0,0);


    // looking for end of the week 
    for ( i = 0; i < config.shop.order.weekdays.length; i++) {
      day=config.shop.order.weekdays[i];
      if(day>=now.getDay()){
        // a valid day is at least>=timelimit 
        next=new Date(now.getTime()+86400000*(day-now.getDay()));
        next.setHours(timelimitH,0,0,0);
        //console.log('----- this week -- delta',((next.getTime()-now.getTime())/3600000),timelimit,(day-now.getDay()))
        if(((next.getTime()-now.getTime())/3600000)>=timelimit){
          //console.log('this week',next)
          return next;
        }
      }
    }

    // looking for begin of the week 
    for (i = 0; i < config.shop.order.weekdays.length; i++) {
      day=config.shop.order.weekdays[i];
      if(day<now.getDay()){
        next=new Date((7-now.getDay()+day)*86400000+now.getTime());
        next.setHours(timelimitH,0,0,0);
        //console.log('----- next week -- delta',((next.getTime()-now.getTime())/3600000),timelimit,((7-now.getDay()+day)))
        if(((next.getTime()-now.getTime())/3600000)>=timelimit){
          //console.log('for next week',next)
          return next;
        }
      }

    }
  };

  Order.prototype.findCurrentShippingDay=function(){
    var timelimitH=Number(Object.keys(config.shop.order.shippingtimes).sort()[0])+8;
    timelimitH=23;
    return this.findNextShippingDay(0.1,timelimitH);
  };


  Order.prototype.getTotalPrice=function(factor){
    var total=0.0;
    if(this.items){
      this.items.forEach(function(item){
        //
        // item should not be failure (fulfillment)
        if(item.fulfillment.status!=='failure'){
          total+=item.finalprice;
        }
      });
    }

    // before the payment fees! 
    // add shipping fees 
    total+=this.getShippingPrice();

    //
    // add gateway fees
    for (var gateway in config.shop.order.gateway){
      gateway=config.shop.order.gateway[gateway];
      if (gateway.label===this.payment.issuer){
        total+=total*gateway.fees;
        break;
      }
    }

    // add mul factor
    if(factor){total*=factor;}


    return parseFloat((Math.round(total*20)/20).toFixed(2));
  };

  Order.prototype.getShippingPrice=function(){
      // check if value exist, (after creation) 
    if(this.payment.fees&&this.payment.fees.shipping){
      return this.payment.fees.shipping;
    }

    //
    // this should be always true, if fulfillment exist then shipping is stored
    //assert(!this.fulfillment)
    return cart.shipping();

  };

  Order.prototype.getOriginPrice=function(factor){
    var total=0.0;
    if(this.items){
      this.items.forEach(function(item){
        //
        // item should not be failure (fulfillment)
        if(item.fulfillment.status!=='failure'){
          total+=(item.price*item.quantity);
        }
      });
    }

    // before the payment fees! 
    // add shipping fees (10CHF)
    total+=config.shop.shipping.price;

    //
    // add gateway fees
    for (var gateway in config.shop.order.gateway){
      gateway=config.shop.order.gateway[gateway];
      if (gateway.label===this.payment.issuer){
        total+=total*gateway.fees;
        break;
      }
    }

    // add mul factor
    if(factor){total*=factor;}


    return parseFloat((Math.round(total*20)/20).toFixed(2));
  };


  Order.prototype.getShippingLabels=function(){
      var when=new Date(this.shipping.when);
      var time=config.shop.order.shippingtimes[when.getHours()];
      var date=moment(when).format('dddd DD MMM YYYY', 'fr');

      return {date:date,time:time};
  };

  Order.prototype.getProgress=function(){
      //
      // end == 100%
      var end=this.items.length+2;
      var progress=0;
      //
      // failure, create, partial, fulfilled
      if(['fulfilled','failure'].indexOf(this.fulfillments.status)!==-1){
        return 100.00;
      }
      progress++;

      //
      // pending, paid, voided, refunded
      if(this.payment.status==='pending'){
        return (progress/end*100.00);
      }

      //
      // progress order items
      progress++;
      for (var i in this.items){
        if(['fulfilled','failure'].indexOf(this.items[i].fulfillment.status)!==-1){
          progress++;
        }
      }
      return (progress/end*100.00);
  };

  Order.prototype.getFulfilledStats=function(){
    var failure=0;
    for (var i in this.items){
      if(['failure'].indexOf(this.items[i].fulfillment.status)!==-1){
        failure++;
      }
    }
    // count failure on initial order
    return failure+'/'+(this.items.length);

  };

  Order.prototype.getTitle=function(){

    //
    // failure,
    if(this.fulfillments.status==='failure'){
      return "Commande annulée";
    }

    //
    // pending, paid, voided, refunded
    if(this.payment.status==='pending'){
      return "Commande en attente de paiement";
    }

    //
    // partial
    if(this.fulfillments.status==='partial'){
      return "La commande est en attente de traitement";
    }
    var labels=this.getShippingLabels();

    return "Livrée le "+labels.date +' de '+labels.time;

  };


  Order.prototype.create=function(shipping,items,payment, cb){
    var self=this, s = backend.$order.save({shipping:shipping,items:items,payment:payment}, function() {
      self.wrap(s);
      if(cb){cb(self);}
    });
    return self;
  };

  Order.prototype.informShopToOrders=function(shop,when,content){
    return this.chain(backend.$order.save({action:shop,id:'email'},{when:when,content:content}).$promise);
  };

  Order.prototype.remove=function(){
    return this.chain(backend.$order.save({action:this.oid,id:'remove'}).$promise);
  };

  Order.prototype.capture=function(){
    return this.chain(backend.$order.save({action:this.oid,id:'capture'}).$promise);
  };

  Order.prototype.refund=function(){
    return this.chain(backend.$order.save({action:this.oid,id:'refund'}).$promise);
  };

  Order.prototype.cancelWithReason=function(reason){
    return this.chain(backend.$order.save({action:this.oid,id:'cancel'},{reason:reason}).$promise);
  };

  Order.prototype.updateItem=function(item,fulfillment, cb){
    var tosave=angular.copy(item);
    tosave.fulfillment.status=fulfillment;
    return this.chain(backend.$order.save({action:this.oid,id:'items'},[tosave]).$promise);
  };

  Order.prototype.updateShipping=function(oid,status){
    return this.chain(backend.$order.save({action:oid,id:'shipping'},{status:status}).$promise);
  };

  Order.prototype.updateCollect=function(shopname,status,when){
    return this.chain(backend.$order.collect({action:shopname,id:'collect'},{status:status,when:when}).$promise);
  };

  Order.prototype.findOrdersByUser=function(user){
    return this.chainAll(backend.$order.query({id:user.id,action:'users'}).$promise);
  };

  Order.prototype.findAllOrders=function(filter, cb){
    var self=this;
    return this.chainAll(backend.$order.query(filter).$promise);
  };

  Order.prototype.findOrdersByShop=function(shop,filter, cb){
    var self=this;
    var params=angular.extend({},filter||{},{id:shop.urlpath,action:'shops'});
    return this.chainAll(backend.$order.query(params).$promise);
  };


  Order.prototype.findRepportForShop=function(filter){
    var self=this, now=new Date();
    var params=angular.extend({},{month:now.getMonth()+1,year:now.getFullYear()},filter||{});
    self.$promise=backend.$repport.get(params).$promise;
    return self;
  };

  var _order=api.wrapDomain(Order,'oid', defaultOrder);
  return _order;
}


})(window.angular);
