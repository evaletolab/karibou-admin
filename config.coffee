exports.config =
  # See docs at http://brunch.readthedocs.org/en/latest/config.html.
  conventions:
    assets:  /^app\/assets\//
    ignored: /^(bower_components\/bootstrap-less(-themes)?|app\/styles\/overrides|(.*?\/)?[_]\w*)/
  modules:
    definition: false
    wrapper: false
  paths:
    public: 'build'
  files:
    javascripts:
      joinTo:
        'js/app.js': /^app/
        'js/vendor.js': /^(bower_components|vendor)/
        'test/scenarios.js': /^test(\/|\\)e2e/
      order:
        before: [
          'bower_components/jquery/dist/jquery.js',
          '/bower_components/raven-js/dist/raven.js',
          'bower_components/bootstrap/dist/js/bootstrap.js',
          'bower_components/fastclick/lib/fastclick.js',
          'bower_components/angular/angular.js',
          'bower_components/angular/angular-loader.js',
          'bower_components/angular/angular-cookies.js',
          'bower_components/angular/angular-resource.js',
          'bower_components/nprogress/nprogress.js',
          'bower_components/underscore/underscore.js'
        ]

    stylesheets:
      joinTo:
        'css/vendor.css': /^(bower_components|vendor)/
        'css/app.css': /^app/
      order:
        before: [
          'bower_components/nprogress/nprogress.css',
          'vendor/styles/font-awesome.css'
          'vendor/styles/bootstrap.css'
        ]
        after: [
          'vendor/styles/bootstrap-theme.css'
        ]

    templates:
      joinTo:
        'js/dontUseMe' : /^app/ # dirty hack for Jade compiling.

  plugins:
    signature:
      file: 'signature'
      ignore: /[\\/][.]/

  #  jade:
  #    pretty: yes # Adds pretty-indentation whitespaces to output (false by default)

  # Enable or disable minifying of result js / css files.
  # minify: true
