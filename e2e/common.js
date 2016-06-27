/**
 * Common functions to be used in multiple e2e tests.
 */

function createObject(identifier) {
    return clickCreateObjectButton()
        .then(selectObjectType)
        .then(typeInIdentifier(identifier))
        .then(saveObject);
}

function clickCreateObjectButton() {
    return element(by.id('object-overview-button-create-object')).click()
}

function selectObjectType() {
    return element(by.id('create-object-option-0')).click();
}

function typeInIdentifier(identifier) {
    var inputField = element(by.id('edit-form-input-0'));
    return typeIn(inputField, identifier);
}

function saveObject() {
    return element(by.id('document-edit-button-save-document')).click();
}

function selectObject(listIndex) {
    return element(by.id('objectList')).all(by.tagName('li')).get(listIndex).click();
}

function typeIn(inputField, text) {
    inputField.clear();
    for (var i in text) {
        inputField.sendKeys(text[i]);
    }
    return inputField;
}

function scrollDown() {
    return browser.executeScript('window.scrollTo(0,200);');
}

function scrollUp() {
    return browser.executeScript('window.scrollTo(0,0);');
}

module.exports = {
    clickCreateObjectButton: clickCreateObjectButton,
    createObject: createObject,
    saveObject: saveObject,
    selectObject: selectObject,
    typeInIdentifier: typeInIdentifier,
    typeIn: typeIn,
    scrollUp: scrollUp,
    scrollDown: scrollDown
};
