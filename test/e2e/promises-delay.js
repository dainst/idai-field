var utils = require("./utils.js");
/*
 * In order to prevent errors caused by e2e tests running too fast you can slow them down by calling the following
 * function. Use higher values for slower tests.
 *
 * utils.delayPromises(50);
 *
 */
var delay = 20;
console.log("Set promises delay to " + delay + " ms.");
utils.delayPromises(delay);
