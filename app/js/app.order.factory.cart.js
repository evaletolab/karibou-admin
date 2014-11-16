;(function(angular) {'use strict';


/**
 * app.order provides a model for interacting with Order.
 * This service serves as a convenient wrapper for other related services.
 */
angular.module('app.order')
.factory('cart', [
  'config',
  '$timeout',
  '$rootScope',
  '$window',
  'api',

  function (config, $timeout,$rootScope,$window, api) {


    var defaultCart={
        namespace:"kariboo_cart",
        cartColumns: [
          //A custom cart column for putting the quantity and increment and decrement items in one div for easier styling.
          { view: function(item, column){
            return  "<span>"+item.get('quantity')+"</span>" + 
                "<div>" +
                  "<a href='javascript:;' class='simpleCart_increment'><img src='/img/cart/increment.png' title='+1' alt='arrow up'/></a>" +
                  "<a href='javascript:;' class='simpleCart_decrement'><img src='/img/cart/decrement.png' title='-1' alt='arrow down'/></a>" +
                "</div>";
          }, attr: 'custom' },
          //Name of the item
          { attr: "name" , label: false },
          { attr: "part" , label: true },
          //Subtotal of that row (quantity of that item * the price)
          { view: 'currency', attr: "total" , label: false  }
        ],


        cartStyle:'div',
        shippingFlatRate: 10,
        taxName:    'Aucun',
        tax:        0.00,
        currency:   "CHF"
    };


    var localStorage=$window['localStorage'];

    
    //
    // default behavior on error
    var onerr=function(data,config){
    };
    
    var Cart = function(data) {
      this.items = [];
      this.config={shipping:0,address:undefined}
    }

    Cart.prototype.clear=function(product){
      for(var i=0;i<this.items.length;i++){
        if(this.items[i].sku===product.sku){
          this.items.splice(i,1)
          return this.items;
        }
      }
      
      return this.save();
    }

    Cart.prototype.remove=function(product,silent){
      $rootScope.CartText="Waiting";
      $timeout(function() { $rootScope.CartText=false }, 1000);

      if(!silent){
        var title=(product.pricing&&product.pricing.part)?
                product.pricing.part+", "+product.title+" a été enlevé du panier":
                product.title+" a été enlevé du panier"
        api.info($rootScope,title,2000)
      }

      for(var i=0;i<this.items.length;i++){
        if(this.items[i].sku===product.sku){
          this.items[i].quantity--;

          //
          // update the finalprice
          this.items[i].finalprice=this.items[i].price*this.items[i].quantity

          if(this.items[i].quantity===0){
            this.items.splice(i,1)
          }
          this.save()
          return this.items;
        }
      }
      
      return this.save();
    }

    Cart.prototype.addList=function(products){
      var total=0;
      for(var i in products){
        // if(products[i].isAvailableForOrder()){
          this.add(products[i], true);
          total++;
        // }
      }
      if(total)
        api.info($rootScope,total+" produits de la liste ont été ajoutés dans le panier.",4000);      
      else
        api.info($rootScope," Seul les produits disponibles peuvent être ajoutés dans le panier.",4000);      
    }

    Cart.prototype.add=function(product, silent){
      if(!silent){
        $rootScope.CartText="Waiting";
        $timeout(function() { $rootScope.CartText=false }, 1000);
        api.info($rootScope,product.pricing.part+", "+product.title+" a été ajouté dans le panier",4000);
      }

      for(var i=0;i<this.items.length;i++){
        if(this.items[i].sku===product.sku){

          //
          // check availability
          if(product.pricing&&product.pricing.stock<=this.items[i].quantity){
            return api.info($rootScope,"La commande maximum pour ce produit à été atteintes.",4000);                        
          }

          this.items[i].quantity++;
          //
          // update the finalprice
          this.items[i].finalprice=this.items[i].price*this.items[i].quantity

          return this.items;
        }
      }


      this.items.push({
        title:product.title,
        sku:product.sku,
        thumb:product.photo.url,
        price:product.getPrice(),
        finalprice:product.getPrice(),
        categories:product.categories._id,
        categoryLabel:product.categories.name,
        vendor:product.vendor._id,
        vendorName:product.vendor.name,
        discount:product.isDiscount(),
        part:product.pricing.part,
        quantity:1
      });
      return this.save();
    }

    Cart.prototype.setError=function(errors){
      var sku, item;

      for(var i=0;i<errors.length;i++){
        sku=Object.keys(errors[i])[0];
        item=this.findBySku(sku)
        if (item)item.error=errors[i][sku];
      }
    }


// clear error 
    Cart.prototype.clearErrors=function(){
      for(var i=0;i<this.items.length;i++){
        if(this.items[i].error )this.items[i].error=undefined
      }
    }


    Cart.prototype.hasError=function(){
      for(var i=0;i<this.items.length;i++){
        if(this.items[i].error){
          return true
        }
      }
      return false;
    }
    

    Cart.prototype.findBySku=function(sku){
      var product = false;
      this.items.forEach(function (item) {
        if(item.sku==sku){
          product=item
        }
      });
      return product;      
    }

    Cart.prototype.quantity=function(){
      var quantity = 0;
      this.items.forEach(function (item) {
        quantity += item.quantity;
      });
      return quantity;
    }

    Cart.prototype.total=function(){
      var total = 0;
      this.items.forEach(function (item) {
        total += (item.price*item.quantity);
      });
      return total;
    }

    Cart.prototype.grandTotal=function(){
      var total=this.total();
      total=(total + this.tax()*total + this.shipping());
      // Rounding up to the nearest 0.05
      return (Math.ceil(total*20)/20).toFixed(2);

    }

    Cart.prototype.shipping=function(){
      return defaultCart.shippingFlatRate;
    }

    Cart.prototype.tax=function(){
      return defaultCart.tax;
    }

    Cart.prototype.taxName=function(){
      return defaultCart.taxName;
    }

    Cart.prototype.setTax=function(tax, label){
      defaultCart.taxName=label;
      defaultCart.tax=tax;
    }    

    Cart.prototype.checkout=function(){
      alert("Oooops ça marche pas encore...")
    }



    Cart.prototype.empty=function(){
      this.items=[];      
      this.save()
    }


      // storage
    Cart.prototype.save=function () {
      if(!this.items||!localStorage) return;
      // save all the items
      // sessionStorage[defaultCart.namespace]=angular.toJson(items)
      localStorage.setItem(defaultCart.namespace, angular.toJson(this.items));
      return this;
    }

    Cart.prototype.load= function () {
      if(!localStorage)return;
      try {
        var verifyItem=[];
        this.items = angular.fromJson(localStorage.getItem(defaultCart.namespace ));
        this.items.forEach(function (item) {
          if(item.title && item.sku){
            verifyItem.push(item)
          }
        })
        this.items=verifyItem;

        if(console)console.log("loading cart",this.items)
      } catch (e){
        api.error( "Votre ancien caddie n'a pas pu être retrouvé: " + e );
      }

      if (!this.items) {
        this.items=[]
      }
      return this;
    }

    var _cart=new Cart().load();
    return _cart;
  }
]);

})(window.angular);