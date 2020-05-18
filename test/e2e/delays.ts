import {browser} from 'protractor';
import {protractor} from 'protractor';


// use higher values to slow down tests for debugging
const promisesDelay = 0;

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

console.log('Set promises delay to ' + promisesDelay + ' ms.');
delayPromises(promisesDelay);


const ECWaitTime = 20000;
const shortRest = 200;


module.exports = {
    ECWaitTime: ECWaitTime,
    shortRest: shortRest
};
