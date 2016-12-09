/**
 * Common functions to be used in multiple e2e tests.
 */

function typeIn(inputField, text) {
    inputField.clear();
    for (var i in text) {
        inputField.sendKeys(text[i]);
    }
    return inputField;
}

module.exports = {
    typeIn: typeIn
};
