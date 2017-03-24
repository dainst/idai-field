'use strict';

module.exports = function(config) {
    config.set({

        basePath: '../../../',

        frameworks: ['jasmine'],

        files: [
            'node_modules/reflect-metadata/Reflect.js',
            'node_modules/zone.js/dist/zone.js',
            'node_modules/zone.js/dist/long-stack-trace-zone.js',
            'node_modules/zone.js/dist/proxy.js',
            'node_modules/zone.js/dist/sync-test.js',
            'node_modules/zone.js/dist/jasmine-patch.js',
            'node_modules/zone.js/dist/async-test.js',
            'node_modules/zone.js/dist/fake-async-test.js',
            'node_modules/papaparse/papaparse.js',
            'node_modules/systemjs/dist/system.src.js',
            'node_modules/pouchdb/dist/pouchdb.js',
            { pattern: 'node_modules/@angular/**/*.js', included: false, watched: false },
            { pattern: 'node_modules/rxjs/**/*.js', included: false, watched: false },
            { pattern: 'node_modules/angular2-uuid/**/*.js', included: false, watched: false },
            { pattern: 'node_modules/systemjs/dist/system-polyfills.js', included: false, watched: false },

            // our stuff
            { pattern: 'node_modules/idai-components-2/**/!(*spec).js', included: false, watched: false },
            { pattern: 'app/**/*.js', included: false, watched: true },
            { pattern: 'config/*', included: false, watched: false },
            { pattern: 'test/browser/**/*.spec.js', included: false, watched: true },
            'systemjs-base.config.js',
            'test/browser/config/main.js'
        ],

        exclude: [
            'node_modules/@angular/**/*_spec.js',

            // our stuff
            'node_modules/idai-components-2/test/**/*'
        ],

        reporters: ['dots'],

        port: 9877,

        colors: true,

        logLevel: config.LOG_INFO, // it must show WARN for them to be caught in ci. see build script.
        autoWatch: true,

        browsers: [
            'Chrome'
        ],

        singleRun: true
    });
};
