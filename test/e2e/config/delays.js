// use higher values to slow down tests for debugging
var promisesDelay = 0; // this should work perfectly fine on a dev machine. the build script will overwrite this automatically.


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


var ECWaitTime = 4500;
var shortRest = 200;


module.exports = {
    ECWaitTime: ECWaitTime,
    shortRest: shortRest
};
