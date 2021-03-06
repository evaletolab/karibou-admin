;(function(angular) {'use strict';


/**
 * app.order provides a model for interacting with Order.
 * This service serves as a convenient wrapper for other related services.
 */
angular.module('app.cart',[
    'app.config',
    'app.storage',
    'app.api',
    'app.user'
  ])
  .factory('cart',cartFactory);


//
// implement cart
cartFactory.$inject=['config','$timeout','$rootScope','$storage','api','user'];
function cartFactory(config, $timeout,$rootScope, $storage, api,user) {
  var defaultShipping={
    discountA:0,
    discountB:0,
    price:{
      hypercenter:10,
      periphery:17.90
    }, 
    periphery:[]
  };

  var defaultCart={
      namespace:"ge_karibou_cart",
      shippingFlatRate: defaultShipping,
      taxName:    'Aucun',
      tax:        0.00,
      currency:   "CHF",
      postalCode:0
  };

  //
  // part of the config is async loaded
  config.shop.then(function () {
    defaultCart.shippingFlatRate=config.shop.shipping;
  });

  //
  // update deault address when user update his profile
  var onUserUpdateAddress=function(){
    if(!user.addresses.length){
      return;
    }

    var p=(user.hasPrimaryAddress());
    _cart.config.address=user.addresses[(p>-1)?p:0];
    defaultCart.postalCode=_cart.config.address.postalCode;
  };

  $rootScope.$on("user.init",onUserUpdateAddress);
  $rootScope.$on("user.update",onUserUpdateAddress);


  //
  // update deault payment when user update his profile
  $rootScope.$on("user.update.payment",function () {
    if(cart.config){
      cart.config.payment=undefined;
    }
  });



  //
  // using flexible localStorage
  var localStorage=$storage;


  var Cart = function(data) {
    this.items = [];
    this.discount={};
    this.config={hours:16,shipping:0,address:undefined, payment:undefined};
  };

  Cart.prototype.isWeekdaysAvailable=function (weekdays) {
    var nextShippingDay=config.shop&&
                        config.shop.shippingweek&&
                        config.shop.shippingweek[this.config.shipping];

    return (!nextShippingDay||!weekdays||weekdays.indexOf(nextShippingDay.getDay())!==-1);
  };

  Cart.prototype.getShippingDay=function() {
    return config.shop&&
           config.shop.shippingweek&&config.shop.shippingweek[this.config.shipping];
  };

  Cart.prototype.setShippingDay=function(dateIndex,hours) {
    var self=this;
    self.config.shipping=dateIndex;
    self.config.hours=hours||16; //FIXME shipping hours should not be constant
    $rootScope.$broadcast("shipping.update",config.shop.shippingweek[this.config.shipping]);
  };

  //
  // return a label for a shipping delivery time
  Cart.prototype.shippingTimeLabel=function (hours) {
    hours=hours||this.config.hours;
    return config.shop.order&&
           config.shop.order.shippingtimes&&
           config.shop.order.shippingtimes[hours];
  };

  Cart.prototype.roundCHF=function(value) {
    return parseFloat((Math.round(value*20)/20).toFixed(2));
  };

  Cart.prototype.equalItem=function(i,product, variant) {
    var bSku=(this.items[i].sku===product.sku);
    if(!variant){
      return bSku;
    }

    return(this.items[i].variant &&
           this.items[i].variant.title==variant &&
           bSku);
  };

  Cart.prototype.clear=function(product){
    for(var i=0;i<this.items.length;i++){
      if(this.items[i].sku===product.sku){
        this.items.splice(i,1);
        return this.items;
      }
    }
    
    return this.save();
  };

  Cart.prototype.remove=function(product,variant,silent){
    $rootScope.CartText="Waiting";
    $timeout(function() { $rootScope.CartText=false; }, 1000);

    if(!silent){
      var title=(product.pricing&&product.pricing.part)?
              product.pricing.part+", "+product.title+" a été enlevé du panier":
              product.title+" a été enlevé du panier";
      api.info($rootScope,title,2000);
    }

    for(var i=0;i<this.items.length;i++){
      if(this.equalItem(i,product,variant)){
      // if(this.items[i].sku===product.sku){
        this.items[i].quantity--;

        //
        // update the finalprice
        this.items[i].finalprice=this.items[i].price*this.items[i].quantity;

        if(this.items[i].quantity===0){
          this.items.splice(i,1);
        }
        this.save();
        return this.items;
      }
    }
    
    return this.save();
  };


  Cart.prototype.addList=function(products){
    var total=0;
    for(var i in products){
      // if(products[i].isAvailableForOrder()){
        this.add(products[i],products[i].variant, true);
        total++;
      // }
    }
    if(total)
      api.info($rootScope,total+" produits de la liste ont été ajoutés dans le panier.",4000);      
    else
      api.info($rootScope," Seul les produits disponibles peuvent être ajoutés dans le panier.",4000);      
  };

  Cart.prototype.add=function(product, variant, silent){
    // facebook
    if(window.fbq)fbq('track', 'AddToCart');

    if(!silent){
      $rootScope.CartText="Waiting";
      $timeout(function() { $rootScope.CartText=false; }, 1000);
      api.info($rootScope,product.pricing.part+", "+product.title+" a été ajouté dans le panier",2000);
    }

    // throw new Error('TESTING StackTrace here !');

    for(var i=0;i<this.items.length;i++){
      if(this.equalItem(i,product,variant)){
      // if(this.items[i].sku===product.sku && this.items[i].variant){

        //
        // check availability
        if(product.pricing&&product.pricing.stock<=this.items[i].quantity){
          return api.info($rootScope,"La commande maximum pour ce produit à été atteintes.",4000);                        
        }

        this.items[i].quantity++;
        //
        // update the finalprice
        this.items[i].finalprice=this.items[i].price*this.items[i].quantity;

        return this.items;
      }
    }


    this.items.push({
      timestamp:Date.now(),
      title:product.title,
      sku:product.sku,
      variant:{title:variant},
      thumb:product.photo.url,
      price:product.getPrice(),
      finalprice:product.getPrice(),
      categories:product.categories._id,
      categoryLabel:product.categories.name,
      weight:product.categories.weight,
      vendor:product.vendor._id,
      vendorName:product.vendor.name,
      vendorWeekDays:product.vendor.available.weekdays,
      vendorImage:product.vendor.photo.owner,
      discount:product.isDiscount(),
      part:product.pricing.part,
      quantity:1
    });
    return this.save();
  };

  Cart.prototype.vendorDiscount=function(vendor, hasDiscount) {
    var amount=0, vendors=$rootScope.shops;
    if(!vendors.length){
      return 0;
    }

    //
    // compute the dicount 
    var v=_.findWhere(vendors,{_id:vendor});
    //
    // FIXME v is sometimes undefined!
    if(!v || !v.discount||!v.discount.active){
      return hasDiscount||0;
    }


    this.items.forEach(function (item) {
      if(item.vendor===vendor){
        amount+=(item.price*item.quantity);
      }
    });

    var discountMagnitude=Math.floor(amount/v.discount.threshold);
    this.discount[v.urlpath]=discountMagnitude*v.discount.amount

    return this.discount[v.urlpath];
  }

  Cart.prototype.vendorDiscountInfo=function(vendor) {
    var vendors=$rootScope.shops;
    var v=_.findWhere(vendors,{_id:vendor});
    if(!v.discount||!v.discount.threshold){
      return {};
    }
    return v.discount;
  };

  //
  // stotal = items + shipping - total discount
  //  total = stotal + stotal*payment.fees
  // WARNNG -- WARNNG -- WARNNG -- edit in all places 
  Cart.prototype.getExtraDiscount=function() {
    var fees=this.tax()*(this.total()+this.shipping()-this.getTotalDiscount())+this.shipping();
    return this.roundCHF(Math.max(this.getTotalDiscount()-fees,0));
  };

  Cart.prototype.getTotalDiscount=function() {
    var amount=0;
    for(var slug in this.discount){
      amount+=this.discount[slug];
    }
    return amount;
  };

  Cart.prototype.setError=function(errors){
    var sku, item;

    for(var i=0;i<errors.length;i++){
      sku=Object.keys(errors[i])[0];
      item=this.findBySku(sku);
      if (item)item.error=errors[i][sku];
    }
  };


// clear error 
  Cart.prototype.clearErrors=function(){
    for(var i=0;i<this.items.length;i++){
      if(this.items[i].error )this.items[i].error=undefined;
    }
  };


  Cart.prototype.hasError=function(){
    for(var i=0;i<this.items.length;i++){
      if(this.items[i].error){
        return true;
      }
    }
    return false;
  };
  

  Cart.prototype.findBySku=function(sku){
    var product = false;
    this.items.forEach(function (item) {
      if(item.sku==sku){
        product=item;
      }
    });
    return product;      
  };

  Cart.prototype.quantity=function(){
    var quantity = 0;
    this.items.forEach(function (item) {
      quantity += item.quantity;
    });
    return quantity;
  };

  Cart.prototype.total=function(){
    var total = 0;
    this.items.forEach(function (item) {
      total += (item.price*item.quantity);
    });
    return (Math.round(total*20)/20);
  };

  //
  // stotal = items + shipping - total discount
  //  total = stotal + stotal*payment.fees
  // WARNNG -- WARNNG -- WARNNG -- edit in all places 
  Cart.prototype.grandTotal=function(){
    var total=this.total();
    var fees=this.tax()*(total+this.shipping()-this.getTotalDiscount())+this.shipping();
    total+=(fees-this.getTotalDiscount());

    // Rounding up to the nearest 0.05
    return this.roundCHF(total);

  };

  Cart.prototype.hasShippingReduction=function () {
    var total=this.total();

    // implement 3) get free shipping!
    if (defaultCart.shippingFlatRate.discountB&&
        total>=defaultCart.shippingFlatRate.discountB){
      return true;
    }

    // implement 3) get half shipping!
    else 
    if (defaultCart.shippingFlatRate.discountA&&
        total>=defaultCart.shippingFlatRate.discountA){
      return true;
    }

    return (Object.keys(this.discount).length);
  };


  Cart.prototype.isShippingHypercenter=function () {
    var postalCode=this.config.address&&this.config.address.postalCode;
    postalCode=postalCode||user.addresses.length&&user.addresses[0].postalCode;
    if(!postalCode ){
      return true;
    }

    if(defaultCart.shippingFlatRate.periphery.indexOf(postalCode)>-1){
      return false;
    }
    return true;
  }

  Cart.prototype.getShippingSectorPrice=function (postalCode) {
    if(!postalCode ){
      return 'hypercenter';
    }
    if(defaultCart.shippingFlatRate.periphery.indexOf(postalCode)!==-1){
      return 'periphery';
    }
    return 'hypercenter';
  };

  Cart.prototype.shipping=function(discount){
    var total=this.total(),
        addressIdx=this.config.address||0;
    
    //
    // See order for order part of implementation

    //
    // get the base of price depending the shipping sector
    if(this.config.address&&this.config.address.postalCode){
      defaultCart.postalCode=this.config.address.postalCode;
    }
    else if(user.addresses&&user.addresses.length){
      defaultCart.postalCode=user.addresses[addressIdx].postalCode;
    }


    var distance=this.getShippingSectorPrice(defaultCart.postalCode);
    var price=defaultCart.shippingFlatRate.price[distance];

    

    //
    // TODO TESTING MERCHANT ACCOUNT
    if (user.merchant===true){
//      return this.roundCHF(price-defaultCart.shippingFlatRate.priceB);
    }

    
    // implement 3) get free shipping!
    if (defaultCart.shippingFlatRate.discountB&&
        total>=defaultCart.shippingFlatRate.discountB){
      price=(price-defaultCart.shippingFlatRate.priceB);
    }

    // implement 3) get half shipping!
    else 
    if (defaultCart.shippingFlatRate.discountA&&
        total>=defaultCart.shippingFlatRate.discountA){
      price=(price-defaultCart.shippingFlatRate.priceA);
    }

    if(discount){
      var fees=this.tax()*(total+price);
      price-=Math.max(this.getTotalDiscount()-fees,0);
    }

    return this.roundCHF(Math.max(price,0));
  };

  Cart.prototype.tax=function(){
    return defaultCart.tax;
  };

  Cart.prototype.taxName=function(){
    return defaultCart.taxName;
  };

  Cart.prototype.setTax=function(tax, label){
    defaultCart.taxName=label;
    defaultCart.tax=tax;
  };    

  Cart.prototype.checkout=function(){
    alert("Oooops ça marche pas encore...");
  };



  Cart.prototype.empty=function(){
    this.items=[];      
    this.discount={};
    this.save();
  };


    // storage
  Cart.prototype.save=function () {
    if(!this.items||!localStorage) return this;
    // save all the items
    // sessionStorage[defaultCart.namespace]=angular.toJson(items)
    localStorage.setItem(defaultCart.namespace, angular.toJson(this.items));
    return this;
  };

  Cart.prototype.load= function () {
    if(!localStorage)return this;
    try {
      var verifyItem=[];
      this.items = angular.fromJson(localStorage.getItem(defaultCart.namespace ))||[];
      this.items.forEach(function (item) {
        if(item.title && item.sku){
          verifyItem.push(item);
        }
      });
      this.items=verifyItem;

    } catch (e){
      api.error( "Votre ancien caddie n'a pas pu être retrouvé: " + e );
    }

    if (!this.items) {
      this.items=[];
    }
    return this;
  };

  var _cart=new Cart().load();
  return _cart;
}




})(window.angular);