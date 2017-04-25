var fs = require('fs');
var path = require('path');
var fileUrl = require('file-url');
var failFast = require('protractor-fail-fast');

exports.config = {

    seleniumAddress: 'http://localhost:9515/wd/hub',
    baseUrl: fileUrl(path.resolve(__dirname, '../../..') + '/index.html'),

    specs: ['./delays.js', '../**/*.spec.js'],

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
    }, {
        package: 'protractor-fail-fast'
    }],
    params: {
        configPath: 'config/config.test.json',
        configTemplate: { 'environment': 'test' }
    },
    onPrepare: function() {
        if (browser.params.skip_fail_fast == 'noff') {
            console.log("No fail fast.")
        } else {
            jasmine.getEnv().addReporter(failFast.init());
        }

        var FailureScreenshotReporter = function() {

                this.specDone = function(spec) {
                    if (spec.status != 'disabled') {
                        console.log("<= "+spec.fullName+' -- '+spec.status.toUpperCase()+' =>')
                    }
                }
        };
        jasmine.getEnv().addReporter(new FailureScreenshotReporter());
    },
    afterLaunch: function() {
        failFast.clean();
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