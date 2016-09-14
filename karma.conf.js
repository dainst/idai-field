'use strict';

module.exports = function(config) {
    config.set({

        basePath: './',

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
            { pattern: 'node_modules/@angular/**/*.js', included: false, watched: false },
            { pattern: 'node_modules/rxjs/**/*.js', included: false, watched: false },
            { pattern: 'node_modules/angular2-uuid/**/*.js', included: false, watched: false },
            { pattern: 'node_modules/systemjs/dist/system-polyfills.js', included: false, watched: false },
            { pattern: 'node_modules/idai-components-2/**/*.js', included: false, watched: false },

            { pattern: 'app/**/*.js', included: false, watched: true },
            { pattern: 'templates/**/*.html', included: false, watched: true },
            { pattern: 'test/**/*.spec.js', included: false, watched: true },

            'test-main.js'
        ],

        proxies: {
            '/templates/': '/base/templates/'
        },

        exclude: [
            'node_modules/@angular/**/*_spec.js',
            'node_modules/idai-components-2/lib/test/**/*.js',
            'node_modules/idai-components-2/test/**/*.js',
            'node_modules/idai-components-2/e2e/**/*.js'
        ],

        reporters: ['dots'],

        port: 9876,

        colors: true,

        logLevel: config.LOG_INFO,
        autoWatch: true,

        browsers: [
            'Chrome'
        ],

        singleRun: false
    });
};
