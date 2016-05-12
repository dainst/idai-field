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
    var inputField = element(by.id('object-edit-input-identifier'));
    return typeIn(inputField, identifier);
}

function saveObject() {
    return element(by.id('object-edit-button-save-object')).click();
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

module.exports = {
    createObject: createObject,
    saveObject: saveObject,
    selectObject: selectObject,
    typeIn: typeIn
};
