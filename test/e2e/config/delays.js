// use higher values to slow down tests for debugging
var promisesDelay;

const syncingTestsActive = (process.argv.length > 5 && process.argv[5] == '--suite=syncing');
if (syncingTestsActive) {
    promisesDelay = 150;
} else {
    promisesDelay = 0;
}


function delayPromises(milliseconds) {
    var executeFunction = browser.driver.controlFlow().execute;

    browser.driver.controlFlow().execute = function() {
        var args = arguments;

        executeFunction.call(browser.driver.controlFlow(), function() {
            return protractor.promise.delayed(milliseconds);
        });

        return executeFunction.apply(browser.driver.controlFlow(), args);
    };
}

console.log("Set promises delay to " + promisesDelay + " ms.");
delayPromises(promisesDelay);


var ECWaitTime = 20000;
var shortRest = 200;


module.exports = {
    ECWaitTime: ECWaitTime,
    shortRest: shortRest
};
