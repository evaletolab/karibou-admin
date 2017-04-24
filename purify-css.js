var purify = require('purify-css');
var content = ['**/app/js/*.js', '**/app/partials/*.html'];
var css = ['**/app/css/*.css'];

var options = {
  // Will write purified CSS to this file.
  output: './purified.css',
  // Will minify CSS code in addition to purify.
  minify: false,

  // Logs out removed selectors.
  rejected: false
};

purify(content, css, options);
