/**
 * Angular.js plugin
 *
 * Provides an $exceptionHandler for Angular.js
 * http://stackoverflow.com/questions/591857/how-can-i-get-a-javascript-stack-trace-when-i-throw-an-exception
 */
;(function(angular) {
'use strict';

//
// quit if angular isn't on the page
if (!angular) { return;}

function ngStackTraceProvider($provide) {
    var time=Date.now();
    $provide.decorator('$exceptionHandler', ['$delegate','API_SERVER',
        function ($delegate, API_SERVER) {


            // d.add()@http://karibou.evaletolab.ch/js/app.js?cache=1459610462130:6:2237
            function sendRepport(stackframes,ex){
                //
                // do not send more than 1 issue each 1000ms 
                // it kills our message box for nothing
                // this should be done in server side
                if((Date.now()-time)<2000){
                    return;
                }

                var error={
                    agent:window.navigator&&window.navigator.userAgent,
                    path:window.location.href,
                    user:window.currentUser||'anonymous',
                    version:new Date(window.KARIBOU_INSTANCE),
                    referrer:window.referrer||document.referrer,
                    msg:ex.name + ": " + ex.message,
                    formated:(stackframes.slice(0,4).map(function(sf) {
                        return sf.toString();
                    })),
                    stack:stackframes.slice(0,6)
                };

                //
                // do not send if issue equal the last issue 
                // if(errorReport.exception.value==="[object Object]"){
                //     return false;
                // }

                var url=API_SERVER+"/v1/trace/"+btoa(window.location.origin);
                $.ajax({type: 'POST',data: JSON.stringify(error),
                        contentType: 'application/json', url:url});

                time=Date.now();

                return false;
            }

            return function angularExceptionHandler(ex, cause) {
                $delegate(ex, cause);

                // Example of stackframe 
                // columnNumber:0,
                // fileName:"app/js/order/app.order.factory.cart.js",
                // functionName:"add",
                // lineNumber:143
                // $http.get(window.location.hostname+"/js/app.js.map").success(function (source) {
                //     console.log("get source",source)
                // })

                $script([
                    "//cdnjs.cloudflare.com/ajax/libs/stacktrace.js/1.1.0/stacktrace.min.js"
                ],function() {
                    StackTrace.fromError(ex).then(function(stackframes) {
                      
                      sendRepport(stackframes,ex);
                    });                    
                });

                var when=(window.KARIBOU_INSTANCE)?new Date(window.KARIBOU_INSTANCE):null;

                var referrer=window.referrer||document.referrer;
                // throw ex;
            };
        }
    ]);
}


angular.module('app.stacktrace', [])
    .config(['$provide', ngStackTraceProvider]);

})(window.angular);