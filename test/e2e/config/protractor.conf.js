fs = require('fs');

exports.config = {
    chromeDriver: '../../../node_modules/chromedriver/lib/chromedriver/chromedriver',

    baseUrl: 'http://localhost:8081',

    specs: ['./promises-delay.js', '../resources/*.spec.js'],

    directConnect: true,
    exclude: [],
    multiCapabilities: [{
        browserName: 'chrome'
    }],
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
        failOnWarning: false,
        failOnError: true,
        logWarnings: true,
        exclude: []
    }],
    onPrepare: function() {
        var FailureScreenshotReporter = function() {

            this.specDone = function(spec) {
                if (spec.status === 'failed') {

                    browser.takeScreenshot().then(function (png) {
                        var stream = fs.createWriteStream('test/e2e-screenshots/'+spec.fullName.replace(/ /g,"_")+'.png');
                        stream.write(new Buffer(png, 'base64'));
                        stream.end();
                    });
                }
            }
        };
        jasmine.getEnv().addReporter(new FailureScreenshotReporter());


        // Set display size in top suite so one can safely override it for single tests without risk of forgetting to set it back.
        jasmine.getEnv().topSuite().beforeEach({fn: function() {
            browser.manage().window().setSize(
                800, 600);
        }});
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