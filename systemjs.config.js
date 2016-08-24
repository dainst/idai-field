(function(global) {

    var config = {

        paths: {
            'angular2-uuid/*': 'node_modules/angular2-uuid/*.js'
        },
        map: {
            'app': 'app',

            '@angular': 'node_modules/@angular',
            'json': 'app/util/systemjs-json-plugin',
            'ng2-bs3-modal': 'node_modules/ng2-bs3-modal',
            'rxjs': 'node_modules/rxjs',
            'idai-components-2' : 'node_modules/idai-components-2'
        },
        packages: {
            app: {
                main: 'main.js',
                defaultExtension: 'js'
            },
            node_modules: {
                defaultExtension: 'js'
            },
            config: {
                defaultExtension: false,
                meta: {
                    '*.json': {
                        loader: 'json'
                    }
                }
            },
            'rxjs'                             : {main: 'index.js'}
        },
        meta: {
            'node_modules/papaparse/papaparse.js': { format: 'global', exports: 'Papa' }
        }
    };

    var ngPackageNames = [
        'common',
        'compiler',
        'core',
        'http',
        'platform-browser',
        'platform-browser-dynamic',
        'router',
        'router-deprecated',
        'http'
    ];
    // Individual files (~300 requests):
    function packIndex(pkgName) {
        config.packages['@angular/'+pkgName] = { main: 'index.js', defaultExtension: 'js' };
    }
    // Bundled (~40 requests):
    function packUmd(pkgName) {
        config.packages['@angular/'+pkgName] = { main: 'bundles/' + pkgName + '.umd.js', defaultExtension: 'js' };
    }
    // Most environments should use UMD; some (Karma) need the individual index files
    var setPackageConfig = System.packageWithIndex ? packIndex : packUmd;
    // Add package entries for angular packages
    ngPackageNames.forEach(setPackageConfig);

    System.config(config);

    System.import('node_modules/jquery/dist/jquery.js')
        .then(function() { System.import('node_modules/bootstrap/dist/js/bootstrap.js'); }, null);

})(this);