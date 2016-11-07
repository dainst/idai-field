(function(global) {

    var config = {

        paths: {
            'angular2-uuid/*': 'node_modules/angular2-uuid/*.js'
        },
        map: {
            'app': 'app',
            '@angular': 'node_modules/@angular',
            '@ng-bootstrap': 'node_modules/@ng-bootstrap',
            'json': 'app/util/systemjs-json-plugin',
            'rxjs': 'node_modules/rxjs',
            'ts-md5': 'node_modules/ts-md5',
            'idai-components-2' : 'node_modules/idai-components-2'
        },
        packages: {
            app: {
                main: 'main.js',
                format: 'cjs',
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
            'rxjs': {main: 'index.js'},
            '@ng-bootstrap/ng-bootstrap': { main: 'index.js' }
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
        'forms'
    ];

    function packUmd(pkgName) {
        config.packages['@angular/'+pkgName] = { main: 'bundles/' + pkgName + '.umd.js', defaultExtension: 'js' };
    }
  
    ngPackageNames.forEach(packUmd);

    if(typeof process != 'object') {
        console.log('Running in browser, disabling NodeJS functionality.');
        config.map['@node/fs'] = '@empty';
    } else {
        console.log('Running as electron app, enabling NodeJS functionality.');
    }

    System.config(config);

})(this);