const fs = require('fs');
const path = require('path');
const fileUrl = require('file-url');
const failFast = require('protractor-fail-fast');

const failFastActive = (process.argv.length > 4 && process.argv[4] == '--params=ff');
const syncingTestsActive = (process.argv.length > 5 && process.argv[5] == '--suite=syncing');

exports.config = {

    seleniumAddress: 'http://localhost:9515/wd/hub',
    baseUrl: fileUrl(path.resolve(__dirname, '../../..') + '/index.html'),

    suites: {
        default: [
            '../syncing/*.spec.js',
            '../images/*.spec.js',
            '../import/*.spec.js',
            '../list/*.spec.js',
            '../resources/*.spec.js',
            '../resources/map/*.spec.js',
            '../widgets/*.spec.js',
            '../settings/*.spec.js'
        ],
        flaky: [
            '../flaky/*.spec.js'
        ]
    },

    allScriptsTimeout: 110000,
    getPageTimeout: 100000,
    framework: 'jasmine2',
    jasmineNodeOpts: {
        isVerbose: false,
        showColors: true,
        includeStackTrace: false,
        defaultTimeoutInterval: 400000
    },
    plugins: [{
        package: 'protractor-console-plugin',
        failOnWarning: true,
        failOnError: true,
        logWarnings: true,
        exclude: [
            "http://localhost:3001/" // pouchdb issues ignorable errors when syncing
        ]
    }],
    params: {
        configPath: 'config/config.test.json',
        configTemplate: { 'dbs' : ['test'] }
    },
    onPrepare: function() {
        if (failFastActive) {
            console.log("Fail fast mode active");
            jasmine.getEnv().addReporter(failFast.init());
        }
        if (syncingTestsActive) {
            console.log("syncing test suite active");
        }

        var FailureScreenshotReporter = function() {

            this.specStarted = function(spec) {
                process.stdout.write("SPEC " + spec.fullName + " ")
            };

            this.specDone = function(spec) {
                console.log(spec.status.toUpperCase())
            }
        };
        jasmine.getEnv().addReporter(new FailureScreenshotReporter());
    },
    afterLaunch: function() {
        if (failFastActive) failFast.clean();
    },
    /**
     * ng2 related configuration
     *
     * useAllAngular2AppRoots: tells Protractor to wait for any angular2 apps on the page instead of just the one matching
     * `rootEl`
     *
     */
    useAllAngular2AppRoots: true
};

if (failFastActive) exports.config.plugins.push({package: 'protractor-fail-fast'});