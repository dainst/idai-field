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

config.packages['rxjs/operators'] = {
    main: 'index.js',
    defaultExtension: 'js'
};

config.packages['rxjs/internal-compatibility'] = {
    main: 'index.js',
    defaultExtension: 'js'
};

config.packages['rxjs/testing'] = {
    main: 'index.js',
    defaultExtension: 'js'
};

config.packages['rxjs/ajax'] = {
    main: 'index.js',
    defaultExtension: 'js'
};

config.packages['rxjs/webSocket'] = {
    main: 'index.js',
    defaultExtension: 'js'
};

config.packages['rxjs-compat'] = {
    main: 'index.js',
    defaultExtension: 'js'
};

config.packages['tsfun'] = {
    main: 'index.js',
    defaultExtension: 'js'
};

config.packages['idai-components-2'] = {
    main: 'index.js',
    defaultExtension: 'js'
};

<<<<<<< HEAD


config.packages['angular-uuid'] = {
    main: 'index.js',
    defaultExtension: 'js'
};

=======
>>>>>>> 490200399298195d1594e880962a43a3d6cae389
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

<<<<<<< HEAD

config.packages['@angular/common/http'] = { main: '../bundles/common-http.umd.js', defaultExtension: 'js' }


// config.paths = {
//     'angular2-uuid/*': 'node_modules/angular2-uuid/*.js'
// };

=======
>>>>>>> 490200399298195d1594e880962a43a3d6cae389
config.map = {
    'app': 'app',
    '@angular': 'node_modules/@angular',
    '@ng-bootstrap/ng-bootstrap': 'node_modules/@ng-bootstrap/ng-bootstrap/bundles/ng-bootstrap.umd.js',
    'json': 'app/util/systemjs-json-plugin',
    'rxjs': 'node_modules/rxjs',
    'rxjs-compat': 'node_modules/rxjs-compat',
    'ts-md5': 'node_modules/ts-md5',
    'idai-components-2' : 'node_modules/idai-components-2',
    'tsfun' : 'node_modules/tsfun',
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
    'viz.js': 'node_modules/viz.js/viz.js',
    'svg-pan-zoom': 'node_modules/svg-pan-zoom/dist/svg-pan-zoom.js',
    'stream': '@node/stream',
    'util': '@node/util',
    'string_decoder': '@node/string_decoder',
    'memorystream': 'node_modules/memorystream/index.js',
    'pouchdb-load': 'node_modules/pouchdb-load/dist/pouchdb.load.js',
    'pouchdb-replication-stream': 'node_modules/pouchdb-replication-stream/dist/pouchdb.replication-stream.js',
    'showdown': 'node_modules/showdown/dist/showdown.js',
    'angular2-uuid': 'node_modules/angular2-uuid/index.js'
};

config.meta = {
    'node_modules/papaparse/papaparse.js': { format: 'global', exports: 'Papa' }
};