const fs = require('fs');
const path = require('path');
const fileUrl = require('file-url');
const failFast = require('protractor-fail-fast');

const failFastActive = (process.argv.length > 4 && process.argv[4] == '--params=ff');

exports.config = {

    seleniumAddress: 'http://localhost:9515/wd/hub',
    baseUrl: fileUrl(path.resolve(__dirname, '../../..') + '/index.html'),

    suites: {
        default: [
            '../settings/*.spec.js',
            '../syncing/*.spec.js',
            '../images/*.spec.js',
            '../list/*.spec.js',
            '../resources/*.spec.js',
            '../map/*.spec.js',
            '../widgets/*.spec.js',
            '../import/*.spec.js'
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
        appDataPath: 'test/test-temp',
        configPath: 'config/config.test.json',
        configTemplate: { 'dbs' : ['test'] }
    },
    onPrepare: function() {
        if (failFastActive) jasmine.getEnv().addReporter(failFast.init());

        var ProgressReporter = function() {

            this.specStarted = function(spec) {
                setTimeout( // to show spec done first
                    function() {
                        process.stdout.write("SPEC " + spec.fullName + " ")
                    },20)

            };

            this.specDone = function(spec) {
                console.log(spec.status.toUpperCase());

                browser.manage().logs().get('browser').then(function(browserLogs) {

                    var errLogs = browserLogs.filter(function (log) {
                        return (log.level.value_ > 900 && (log.message.
                            indexOf('Failed to load resource') === -1))});


                    if (errLogs.length > 0) {

                        console.log('--- There has been at least one browser console error (Spec '+spec.fullName+')!');

                        browserLogs.forEach(function(log){
                            if (log.level.value_ > 900) { // it's an error log
                                if (log.message.
                                    indexOf('Failed to load resource') === -1) {

                                    console.log("===> critical ERROR message: ",log.message);
                                } else {
                                    console.log("(uncritical) Error message: ",log.message);
                                }
                            } else {
                                console.log("Log message: ",log.message);
                            }
                        });
                    }


                });

            }
        };
        jasmine.getEnv().addReporter(new ProgressReporter());
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