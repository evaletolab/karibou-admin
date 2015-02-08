;(function(angular) {'use strict';

/**
 * Define the User directives for (app.user)
 * provides directives for interacting withUser on views.
 */


angular.module('app.user.ui', [
  'app.config',
  'app.api'
])

/**
 * this should be usefull to help the display of the primary address
 */
.filter("primary",function(){
  return function(primary,user){
    if (primary)return primary;
    return (user.addresses.length==1)?'true':'false';
  }
})

//
// compute passwrod strength
// http://blog.brunoscopelliti.com/angularjs-directive-to-test-the-strength-of-a-password
.directive('passwordStrength', function () {

    return {
        replace: false,
        scope: {pw: "=passwordStrength"},
        restrict: 'EACM',
        link: function (scope, iElement, iAttrs) {

            var strength = {
                colors: ['#F00', '#F90', '#FF0', '#9F0', '#0F0'],
                mesureStrength: function (p) {
                    if(!p)return 0;
                    var _force = 0;
                    var _regex = /[$-/:-?{-~!"^_`\[\]]/g;

                    var _lowerLetters = /[a-z]+/.test(p);
                    var _upperLetters = /[A-Z]+/.test(p);
                    var _numbers = /[0-9]+/.test(p);
                    var _symbols = _regex.test(p);

                    var _flags = [_lowerLetters, _upperLetters, _numbers, _symbols];
                    var _passedMatches = $.grep(_flags, function (el) { return el === true; }).length;

                    _force += 2 * p.length + ((p.length >= 10) ? 1 : 0);
                    _force += _passedMatches * 10;

                    // penality (short password)
                    _force = (p.length <= 6) ? Math.min(_force, 10) : _force;

                    // penality (poor variety of characters)
                    _force = (_passedMatches == 1) ? Math.min(_force, 10) : _force;
                    _force = (_passedMatches == 2) ? Math.min(_force, 20) : _force;
                    _force = (_passedMatches == 3) ? Math.min(_force, 40) : _force;

                    return _force;

                },
                getColor: function (s) {

                    var idx = 0;
                    if (s <= 10) { idx = 0; }
                    else if (s <= 20) { idx = 1; }
                    else if (s <= 30) { idx = 2; }
                    else if (s <= 40) { idx = 3; }
                    else { idx = 4; }

                    return { idx: idx + 1, col: this.colors[idx] };

                }
            };

            // http://odetocode.com/blogs/scott/archive/2013/09/11/moving-data-in-an-angularjs-directive.aspx
            iAttrs.$observe(iAttrs.passwordStrength, function (value) {
                console.log('password',scope.pw, value);
                if (scope.pw === ''|| !scope.pw) {
                    iElement.css({ "display": "none"  });
                } else {
                    var c = strength.getColor(strength.mesureStrength(scope.pw));
                    iElement.css({ "display": "inline" });
                    iElement.children('li')
                        .css({ "background": "#DDD" })
                        .slice(0, c.idx)
                        .css({ "background": c.col });
                }
            });

        },
        template: '<li class="point"></li><li class="point"></li><li class="point"></li><li class="point"></li><li class="point"></li>'
    };

});

})(window.angular);
