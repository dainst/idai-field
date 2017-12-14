var config = {
    packages: {}
};

config.defaultJSExtensions = true;

config.packages.app = {
    main: 'main.js',
    format: 'cjs',
    defaultExtension: 'js'
};

config.packages['rxjs'] = {
    main: 'index.js',
    defaultExtension: 'js'
};

config.packages.lodash = {
    main: 'index.js',
    defaultExtension: 'js'
};

config.packages.node_modules = {
    defaultExtension: 'js'
};

config.packages.config = {
    defaultExtension: false,
    meta: {
        '*.json': {
            loader: 'json'
        }
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

config.paths = {
    'angular2-uuid/*': 'node_modules/angular2-uuid/*.js'
};

config.map = {
    'app': 'app',
    '@angular': 'node_modules/@angular',
    '@ng-bootstrap/ng-bootstrap': 'node_modules/@ng-bootstrap/ng-bootstrap/bundles/ng-bootstrap.js',
    'json': 'app/util/systemjs-json-plugin',
    'rxjs': 'node_modules/rxjs',
    'ts-md5': 'node_modules/ts-md5',
    'idai-components-2' : 'node_modules/idai-components-2',
    'pouchdb': 'node_modules/pouchdb/dist/pouchdb.js',
    'fs' : '@node/fs',
    'express': '@node/express',
    'express-pouchdb': '@node/express-pouchdb-dainst',
    'electron': 'app/desktop/electron',
    'deep-equal': 'node_modules/deep-equal/index.js',
    'moment': 'node_modules/moment/min/moment-with-locales.js',
    'ip': 'node_modules/ip/lib/ip.js',
    'os': '@node/os',
    'buffer': '@node/buffer',
    'lodash': 'node_modules/lodash'
};

config.meta=  {
    'node_modules/papaparse/papaparse.js': { format: 'global', exports: 'Papa' }
};