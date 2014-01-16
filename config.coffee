exports.config =
  # See docs at http://brunch.readthedocs.org/en/latest/config.html.
  modules:
    definition: false
    wrapper: false
  paths:
    public: 'build'
  files:
    javascripts:
      joinTo:
        'js/app.js': /^app/
        'js/vendor.js': /^vendor/
        'test/scenarios.js': /^test(\/|\\)e2e/
      order:
        before: [
          'vendor/scripts/jquery.2.0.0.js',
          'vendor/scripts/bootstrap.min.js',
          'vendor/scripts/angular.js',
          'vendor/scripts/angular-loader.js',
          'vendor/scripts/angular-cookies.js',
          'vendor/scripts/angular-resource.js',
          'vendor/scripts/jquery.backstretch.min.js'
        ]

    stylesheets:
      joinTo:
        'css/vendor.css': /^vendor/
        'css/app.css': /^app/
      order:
        before: [
          'vendor/styles/bootstrap-combined.no-icons.min'
          'vendor/styles/font-awesome.min.css'
        ]
        after: [
          'vendor/styles/bootstrap-responsive.css'
        ]
        
    templates:
      joinTo: 'js/templates.js'

  plugins:
    jade:
      pretty: yes # Adds pretty-indentation whitespaces to output (false by default)

  # Enable or disable minifying of result js / css files.
  # minify: true 
