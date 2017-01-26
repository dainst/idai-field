debugger;
if (!Object.hasOwnProperty('name')) {
    Object.defineProperty(Function.prototype, 'name', {
        get: function() {
            var matches = this.toString().match(/^\s*function\s*(\S*)\s*\(/);
            var name = matches && matches.length > 1 ? matches[1] : "";
            Object.defineProperty(this, 'name', {value: name});
            return name;
        }
    });
}

// Turn on full stack traces in errors to help debugging
Error.stackTraceLimit = Infinity;

jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000;

// Cancel Karma's synchronous start,
// we will call `__karma__.start()` later, once all the specs are loaded.
__karma__.loaded = function() {};

// Load our SystemJS configuration.
System.config({
    baseURL: '/base/',
    defaultJSExtensions: true,
    paths: {
        'angular2-uuid/*': 'node_modules/angular2-uuid/*.js'
    },
    map: {
        'rxjs': 'node_modules/rxjs',
        '@angular': 'node_modules/@angular',
        'idai-components-2' : 'node_modules/idai-components-2',
        'json': 'app/util/systemjs-json-plugin',
        'pouchdb': 'node_modules/pouchdb/dist/pouchdb'
    },
    packages: {
        config: {
            defaultExtension: false,
            meta: {
                '*.json': {
                    loader: 'json'
                }
            }
        },


        '@angular/core': {
            main: 'bundles/core.umd.min.js',
            defaultExtension: 'js'
        },
        '@angular/compiler': {
            main: 'bundles/compiler.umd.min.js',
            defaultExtension: 'js'
        },
        '@angular/common': {
            main: 'bundles/common.umd.min.js',
            defaultExtension: 'js'
        },
        '@angular/http': {
            main: 'bundles/http.umd.min.js',
            defaultExtension: 'js'
        },
        '@angular/platform-browser': {
            main: 'bundles/platform-browser.umd.min.js',
            defaultExtension: 'js'
        },
        '@angular/platform-browser-dynamic': {
            main: 'bundles/platform-browser-dynamic.umd.min.js',
            defaultExtension: 'js'
        },
        '@angular/router': {
            main: 'bundles/router.umd.min.js',
            defaultExtension: 'js'
        },
        '@angular/forms': {
            main: 'bundles/forms.umd.min.js',
            defaultExtension: 'js'
        },
        '@angular/core/testing': {
            main: '../bundles/core-testing.umd.js',
            defaultExtension: 'js'
        },
        '@angular/compiler/testing': {
            main: '../bundles/compiler-testing.umd.js',
            defaultExtension: 'js'
        },
        '@angular/common/testing': {
            main: '../bundles/common-testing.umd.js',
            defaultExtension: 'js'
        },
        '@angular/http/testing': {
            main: '../bundles/http-testing.umd.js',
            defaultExtension: 'js'
        },
        '@angular/platform-browser/testing': {
            main: '../bundles/platform-browser-testing.umd.js',
            defaultExtension: 'js'
        },
        '@angular/platform-browser-dynamic/testing': {
            main: '../bundles/platform-browser-dynamic-testing.umd.js',
            defaultExtension: 'js'
        },
        '@angular/router/testing': {
            main: '../bundles/router-testing.umd.js',
            defaultExtension: 'js'
        },
        '@angular/forms/testing': {
            main: 'bundles/forms-testing.umd.js',
            defaultExtension: 'js'
        },
        'rxjs': {
            defaultExtension: 'js'
        }
    }
});

Promise.all([
    System.import('@angular/core/testing'),
    System.import('@angular/platform-browser-dynamic/testing')
]).then(function (providers) {
    debugger;
    var testing = providers[0];
    var testingBrowser = providers[1];

    testing.TestBed.initTestEnvironment(testingBrowser.BrowserDynamicTestingModule,
        testingBrowser.platformBrowserDynamicTesting());

}).then(function() {
    return Promise.all(
        Object.keys(window.__karma__.files) // All files served by Karma.
            .filter(onlySpecFiles)
            .map(file2moduleName)
            .map(function(path) {
                return System.import(path).then(function(module) {
                    if (module.hasOwnProperty('main')) {
                        module.main();
                    } else {
                        throw new Error('Module ' + path + ' does not implement main() method.');
                    }
                });
            }));
})
    .then(function() {
        __karma__.start();
    }, function(error) {
        console.error(error.stack || error);
        __karma__.start();
    });


function onlySpecFiles(path) {
    // check for individual files, if not given, always matches to all
    var patternMatched = __karma__.config.files ?
        path.match(new RegExp(__karma__.config.files)) : true;

    return patternMatched && /[\.|_]spec\.js$/.test(path);
}

// Normalize paths to module names.
function file2moduleName(filePath) {
    return filePath.replace(/\\/g, '/')
        .replace(/^\/base\//, '')
        .replace(/\.js$/, '');
}
