exports.config = {
    chromeDriver: '../../../node_modules/chromedriver/lib/chromedriver/chromedriver',

    baseUrl: 'http://localhost:8081',

    suites: {
        resources: [
            '../promises-delay.js', '../resources/*.spec.js'
        ],
        map: [
            '../promises-delay.js', '../map/*.spec.js'
        ],
        images: [
            '../promises-delay.js', '../images/*.spec.js'
        ],
        import: [
            '../promises-delay.js', '../import/*.spec.js'
        ]
    },

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
        browser.manage().window().setSize(800, 600);
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