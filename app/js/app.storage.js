;(function(angular) {'use strict';

//
// When Safari (OS X or iOS) is in private browsing mode, it appears as though localStorage
// is available, but trying to call .setItem throws an exception below:
// "QUOTA_EXCEEDED_ERR: DOM Exception 22: An attempt was made to add something to storage that exceeded the quota."
angular.module('app.storage',[])
  .factory('$storage', storageService);



/**
 * app.storage provide service for localStorage.
 */
storageService.$inject=[];
function storageService() {

  //
  // wrap storage
  var Storage = function () {
    function createCookie(name, value, days) {
      var date, expires;

      if (days) {
        date = new Date();
        date.setTime(date.getTime()+(days*24*60*60*1000));
        expires = "; expires="+date.toGMTString();
      } else {
        expires = "";
      }
      document.cookie = name+"="+value+expires+"; path=/";
    }

    function readCookie(name) {
      var nameEQ = name + "=",
          ca = document.cookie.split(';'),
          i, c;

      for (i=0; i < ca.length; i++) {
        c = ca[i];
        while (c.charAt(0)==' ') {
          c = c.substring(1,c.length);
        }

        if (c.indexOf(nameEQ) == 0) {
          return c.substring(nameEQ.length,c.length);
        }
      }
      return null;
    }
    
    function setData(data) {
      data = JSON.stringify(data);
      createCookie('localStorage', data, 365);
    }
    
    function clearData() {
      createCookie('localStorage', '', 365);
    }
    
    function getData() {
      var data = readCookie('localStorage');
      return data ? JSON.parse(data) : {};
    }

    //
    // testing the service
    try{
      window.localStorage.getItem('slkxjljc');
    }catch(e){

      //
      // return the wraper
      // initialise if there's already data
      var data = getData();

      return {
        length: 0,
        hooked:true,
        clear: function () {
          data = {};
          this.length = 0;
          clearData();
        },
        getItem: function (key) {
          return data[key] === undefined ? null : data[key];
        },
        key: function (i) {
          // not perfect, but works
          var ctr = 0;
          for (var k in data) {
            if (ctr == i) return k;
            else ctr++;
          }
          return null;
        },
        removeItem: function (key) {
          delete data[key];
          this.length--;
          setData(data);
        },
        setItem: function (key, value) {
          data[key] = value+''; // forces the value to a string
          this.length++;
          setData(data);
        }
      };
    }

    window.localStorage.hooked=false;

    // local storage is ok in this browser
    return window.localStorage;

  };

  //
  // return the functional localStorage instance
  window.localstorage=new Storage();
  return window.localstorage;
}

})(window.angular);



