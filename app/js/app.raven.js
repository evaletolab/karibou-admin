/**
 * Angular.js plugin
 *
 * Provides an $exceptionHandler for Angular.js
 * http://stackoverflow.com/questions/591857/how-can-i-get-a-javascript-stack-trace-when-i-throw-an-exception
 */
;(function(Raven, angular) {
'use strict';

// quit if angular isn't on the page
if (!angular) {
    return;
}

function ngRavenProvider($provide) {
    $provide.decorator('$exceptionHandler', ['$delegate','API_SERVER',
        function ($delegate, API_SERVER) {

            Raven.config('https://public@getsentry.com/1',{
                fetchContext:true,
                //includePaths:'/*app.js$/',
                shouldSendCallback:function(errorReport){

                    // {
                    //     culprit: "http://lo.cal:3000/js/vendor.js"
                    //     exception: 
                    //     extra: 
                    //     logger: "javascript"
                    //     message: "app.shop.js: testing raven"
                    //     platform: "javascript"
                    //     project: "1"
                    //     request: 
                    //     site: undefined
                    //     stacktrace: 
                    //        frames: Array[9]
                    // }

                    if(errorReport.stacktrace.frames.length>2){
                        errorReport.stacktrace.frames.splice(0,errorReport.stacktrace.frames.length-3);
                    }
                    var url=API_SERVER+"/v1/trace/"+btoa(window.location.origin);
                    $.ajax({type: 'POST',data: JSON.stringify(errorReport),
                            contentType: 'application/json', url:url});


                    return false;
                }
            }).install();

            return function angularExceptionHandler(ex, cause) {
                $delegate(ex, cause);
                var referrer=window.referrer||document.referrer;
                Raven.captureException(ex, {extra: {cause: cause, referer:referrer}});
                // throw ex
            };
        }
    ]);
}


angular.module('app.raven', [])
    .config(['$provide', ngRavenProvider])
    .value('Raven', Raven);

})(window.Raven, window.angular);