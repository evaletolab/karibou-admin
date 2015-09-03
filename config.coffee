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

    templates:
      joinTo:
        'js/templates.js': /^app\/assets\/partial/

    stylesheets:
      joinTo:
        'css/vendor.css': /^(bower_components|vendor)/
        'css/app.css': /^app/
      order:
        before: [
          'app/css/fonts.css',
          'bower_components/nprogress/nprogress.css',
          'vendor/styles/font-awesome.css'
          'vendor/styles/bootstrap.css'
        ]
        after: [
          'vendor/styles/bootstrap-theme.css'
        ]


  keyword:
    # file filter
    filePattern: /\.(css|html)$/

    # By default keyword-brunch has these keywords:
    #     {!version!}, {!name!}, {!date!}, {!timestamp!}
    # using information from package.json
    map:
      distRelease: -> (Date.now())


  plugins:
    signature:
      file: 'signature'
      ignore: /[\\/][.]/

    ng_templates:
      module: 'app.templates'

    html2js: 
      options:
        base: 'app/assets',
        htmlmin: 
          removeComments: true

    jshint:
      pattern: /^app\/.*\.js$/
      options:
        bitwise: false
        curly: false
      globals:
        jQuery: true
      warnOnly: true

  #  jade:
  #    pretty: yes # Adds pretty-indentation whitespaces to output (false by default)

  # Enable or disable minifying of result js / css files.
  # minify: true
