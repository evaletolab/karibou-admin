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
          'vendor/scripts/jquery.min.js'
          'vendor/scripts/select2.min.js'
          'vendor/scripts/shortcut.js'
          'vendor/scripts/freshereditor.min.js'
          'vendor/scripts/bootstrap.min.js'
          'vendor/scripts/angular-1.1.3.min.js'
          'vendor/scripts/angular-cookies.min.js'
          'vendor/scripts/angular-resource.min.js'
          'vendor/scripts/jquery.backstretch.min.js'
        ]

    stylesheets:
      joinTo:
        'css/app.css': /^app/
        'css/vendor.css': /^vendor/
      order:
        before: [
          'app/css/fonts.css'
        ]
        
    templates:
      joinTo: 'js/templates.js'

  plugins:
    jade:
      pretty: yes # Adds pretty-indentation whitespaces to output (false by default)

  # Enable or disable minifying of result js / css files.
  # minify: true
