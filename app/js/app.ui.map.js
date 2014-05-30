
//
var map=angular.module('app.ui.map',['app.config','leaflet-directive']);


/**
 * app.shop provides a model for interacting with Shop.
 * This service serves as a convenient wrapper for other related services.
 */

map.factory('Map', [
  'config',
  '$location',
  '$rootScope',
  '$route',
  '$http',
  'api',
  
  function (config, $location, $rootScope, $route, $http, api) {

  	// init icon
  	var icons, statickey="AIzaSyD5w46BmWX6hX-uJ2yMycS_cRb2HRvDXQU";

    //
    // make leaflet loading asynchrone
    $script.ready("leaflet",function(){
      // prepare Leaflet
      if (L.AwesomeMarkers){
          icons={
            user:L.AwesomeMarkers.icon({icon: 'user', prefix: 'fa', markerColor: 'red', spin:false}),
            coffe:L.AwesomeMarkers.icon({icon: 'coffee', markerColor: 'orange', prefix: 'fa', iconColor: 'black'}),
            truck:L.AwesomeMarkers.icon({icon: 'truck', markerColor: 'cadetblue', prefix: 'fa', iconColor: 'white'}),
            cart:L.AwesomeMarkers.icon({icon: 'shopping-cart',  prefix: 'fa', markerColor: 'cadetblue'}),
            home:L.AwesomeMarkers.icon({icon: 'home',  prefix: 'fa', markerColor: 'cadetblue'}),
          }         
      }
    });


    // init openstreetmap
    var defaultMap={
      icons:{},
      geneva: {
          lat: 46.2017559, 
          lng: 6.1466014,
          zoom: 12
      },
      legend: {
          position: 'bottomleft',
          colors: [  '#ff0000', '#0000ff'],
          labels: [  'Livraison', 'Collecte' ]
      },
      defaults: {
        tileLayer: "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        _tileLayer: "http://{s}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png"
      },
      events: {
          map: {
              enable: ['click'],
              logic: 'emit'
          }
      },      
      markers: {}      
    };  



    var Map = function() {
    	this.map={};
    	angular.copy(defaultMap,map);
    }
    
    //
    // map contains {
    //	legend:{
    //		labels:['Mon addresse']
	//	}, 
	//	markers:{
	//		"key":{lat,lng,message,focus, draggable, icon}
	//  }
	// }
    Map.prototype.addMarker=function(id, marker){
    	if(!map.markers[id])
    		map.markers[id]={};

    	angular.extend(map.markers[id], marker,{focus:false,draggable:false});
    	return map;
    }

    Map.prototype.removeMarker=function(id){
    	if(map.markers[id])
    		delete map.markers[id];
    	return map;
	}

    Map.prototype.getMap=function(){
    	return map;
	}


    //
    // get address
    Map.prototype.geocode=function(street,postal,region, cb){
      //
      // google format: Route de Chêne 34, 1208 Genève, Suisse
      if(!region)region="Suisse";
      var fulladdress=street+","+postal+", "+region;//"34+route+de+chêne,+Genève,+Suisse
      var url="http://maps.googleapis.com/maps/api/geocode/json?address="+fulladdress+"&sensor=false" ;
      $http.get(url,{withCredentials:false}).success(function(geo,status,header,config){
      	cb(geo,status);
      })
    }



    

    //
    // map contains {legend:{labels:['Mon addresse']}, markers}
    Map.prototype.onClick=function($scope, cb){
	    $scope.$on('leafletDirectiveMap.click', function(event){
	        cb()
	    });    
    }

    Map.prototype.getIcons=function(){
    	return icons;
    }

    //
    // generate a static map to replace interactive map
    Map.prototype.resolveStaticmap=function(address, label){
      // no address, no map
      if(!address) return;

      //
      var marker="", 
          center=(Array.isArray(address))?"":"center="+address.region+"&",
          url="http://maps.googleapis.com/maps/api/staticmap?"+center,
          opt="maptype=roadmap&zoom=12&size=600x300",
          id="&key="+statickey;

      function makeMarker(address){
        if (address.geo&&address.geo.lat&&address.geo.lng)
          return "&markers=color:green%7Xlabel:%7C"+address.geo.lat+","+address.geo.lng;
        return ""
      }

      if(Array.isArray(address)){

        for(var i in address)
          marker+=makeMarker(address[i])
      }else{
        marker=makeMarker(address)
      }
      return url+opt+marker+id;
    }    

    
    return Map;
  }
]);

