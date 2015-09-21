;(function(angular) {'use strict';

//
// Define the Order module (app.stats)  for controllers, services and models
angular.module('app.stats', [
  'app.config',
  'app.api'
])
  .config(statsConfig)
  .controller('StatsCtrl',StatsCtrl);

//
// define all routes for user api
statsConfig.$inject=['$routeProvider','$locationProvider','$httpProvider'];
function statsConfig($routeProvider,$locationProvider,$httpProvider) {
  // List of routes of the application
  $routeProvider
    .when('/admin/stats', {title:'Statistic overview ',  templateUrl : '/partials/dashboard/dashboard-stats.html'});
}


//
// define our main stats controller
StatsCtrl.$inject=['$scope','$http','$timeout','$controller','config','api','$log'];
function StatsCtrl($scope, $http, $timeout, $controller, config, api, $log) {

  $controller('OrderCommonCtrl', {$scope: $scope}); 
  $scope.colors=["120,120,220","220,120,120","120,220,120","20,220,220","220,20,220","220,220,20",
                 "40,40,220","40,220,40","220,40,40","40,220,220","220,40,220","220,220,40",
                 "80,150,220","150,80,220","150,220,80","80,220,150","220,80,150","220,150,80",
                 "12,100,250","12,250,100","100,12,250","100,250,12","250,12,100","250,100,12","250,100,12"]

  function addDataSets (data,label,color ) {
    //
    // check if dataset already exist, then return his index
    if(data){
      for (var i = data.datasets.length - 1; i >= 0; i--) {
        if(data.datasets[i].label===label){
          return i;
        }
      };
    }
    if(!color)return -1;
    var set={
      label:label,
      highlightColor: "rgba("+color+",1)",
      hideColor: "#fff",
      fillColor: "rgba("+color+",0)",
      strokeColor: "rgba("+color+",0.7)",
      pointColor: "rgba("+color+",0)",
      pointStrokeColor: "rgba("+color+",0)",
      pointHighlightFill: "#ddd",
      pointHighlightStroke: "rgba("+color+",0.7)",
      data: []     
    }
    for (var i = Object.keys(data.labels).length-1; i >= 0; i--) {
      set.data.push(0);
    };
    data.datasets.push(set);
    return data.datasets.length-1;
  }

  $scope.isHighlight=function(chart, label) {
    return _.find(chart.datasets,function (set) {
      return set.isHighlight==label;
    })
  }

  $scope.highlight=function(chart, label) {
    //
    // restore color
    chart.datasets.forEach(function (segment, i) {
        if(segment.savedColor){
          segment.strokeColor=segment.pointColor=segment.savedColor;
        }
    });

    //
    // toggle dataset
    chart.datasets.forEach(function (segment, i) {
        if(segment.isHighlight == label){
          segment.isHighlight=false;
        }else
        if (segment.label == label) {
          segment.isHighlight=label;
          return false;
        }
    });

    //
    // count highlight
    var highlights=chart.datasets.filter(function (set) {
      return set.isHighlight;
    });
    //
    // reset highlight
    if(!highlights.length){

      return chart.update();
    }

    //
    // hide series
    chart.datasets.forEach(function (segment, i) {
        // init stroke color
        segment.savedColor=segment.strokeColor;

        // except label
        if(segment.isHighlight){
          return
        }

        segment.strokeColor=segment.pointColor=segment.fillColor;
    })
    chart.update();

  }

  $scope.getSellsByYearAndWeek=function () {
    $scope.loading=true;
    $http.get(config.API_SERVER+'/v1/stats/orders/sells').success(function(stats,status,header,config){
      $scope.sells=stats;
      $scope.loading=false;

      if(!window.Chart){
        return;
      }
      //
      // loading Chart
      $timeout(function(){
        var data={
          labels: Object.keys(stats.axis.x),
          datasets: []        
        }
        addDataSets(data,"Ventes","220,220,220")
        addDataSets(data,"Commande","151,187,205")
        Object.keys(stats).forEach(function(year){
            Object.keys(stats[year]).forEach(function (week) {
              data.datasets[0].data[stats.axis.x[year+'.'+week]]=stats[year][week].total;
              data.datasets[1].data[stats.axis.x[year+'.'+week]]=stats[year][week].orders;
            });
        });

        // data.datasets.forEach(function (set) {
        //   console.log('getSellsByYearAndWeek =>',set.label,set.data.join(','));
        // })
        // Get the context of the canvas element we want to select
        if(!$scope.sellsChart){
          var ctx = document.getElementById("sells-chart").getContext("2d");
          $scope.sellsChart = new Chart(ctx).Line(data, {
            multiTooltipTemplate: "<%= datasetLabel %> - <%= value %>"
          });
        }

      })


    });  
  }

  $scope.getCAByYearMonthAndVendors=function () {
    $scope.loading=true;
    $http.get(config.API_SERVER+'/v1/stats/orders/ca/shop').success(function(stats,status,header,config){
      var ca=$scope.ca={};
      $scope.loading=false;

      if(!window.Chart){
        return;
      }
      //
      // loading Chart
      $timeout(function(){

        //
        // create axis X and Y
        var data={
          labels: Object.keys(stats.axis.x).reverse(),
          datasets: []        
        }
        Object.keys(stats.axis.series).forEach(function (shop,i) {
          addDataSets(data,shop,$scope.colors[i]);
        });

        ca.data=data;

        //
        // map data in axis
        Object.keys(stats).forEach(function(year){
            Object.keys(stats[year]).forEach(function (month) {
              Object.keys(stats[year][month]).forEach(function (shop) {
                  var idx=addDataSets(data,shop);
                  if(idx!==-1){
                    data.datasets[idx].data[stats.axis.x[year+'.'+month]]=stats[year][month][shop].fees;
                  }
              });
            });
        })

        // data.datasets.forEach(function (set) {
        //   console.log('getCAByYearMonthAndVendors =>',set.label,set.data.join(','));
        // })
        // Get the context of the canvas element we want to select
        if(!$scope.ca.Chart){
          var ctx = document.getElementById("ca-chart").getContext("2d");
          $scope.ca.Chart=new Chart(ctx).Line(data, {
            tooltipTemplate: "<%= value %>%",
            multiTooltipTemplate:"<%= datasetLabel %> - <%= value %>",
            bezierCurveTension:0.3,
            animationSteps:30
          });
          $scope.ca.legends=ca.Chart.generateLegend();

        }
      });

    });  
  }

  $scope.ordersByUsers=function () {
    $scope.oByUsers=[];
    $scope.loading=true;
    $http.get(config.API_SERVER+'/v1/stats/orders/by/users').success(function(stats,status,header,config){
      $scope.oByUsers=stats;
      $scope.loading=false;
    });


  }

  $scope.loadStats=function(){
    $scope.getCAByYearMonthAndVendors();
    $scope.getSellsByYearAndWeek();
    $scope.ordersByUsers();
  }
}

})(window.angular);
