/**
 * Common functions to be used in multiple e2e tests.
 */

function createObject(identifier) {
    return clickCreateObjectButton()
        .then(selectObjectType)
        .then(chooseGeometry)
        .then(typeInIdentifier(identifier))
        .then(scrollUp)
        .then(saveObject)
}

function clickCreateObjectButton() {
    return element(by.id('object-overview-button-create-object')).click()
}

function selectObjectType() {
    return element(by.id('choose-type-option-0')).click();
}

function chooseGeometry(geometry) {
    var geom = 'none';
    if (geometry) geom = geometry;
    return element(by.id('choose-geometry-option-'+geom)).click();
}

function typeInIdentifier(identifier) {
    var inputField = element(by.css('#edit-form-element-0 input'));
    return typeIn(inputField, identifier);
}

function switchToEditMode() {
    return element(by.id('document-view-button-edit-document')).click();
}

function saveObject() {
    return element(by.id('document-edit-button-save-document')).click();
}

function gotoView() {
    return element(by.id('document-edit-button-goto-view')).click();
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

function clickSaveInModal() {
    return element(by.id('overview-save-confirmation-modal-save-button')).click();
}

function clickCancelInModal() {
    return element(by.id('overview-save-confirmation-modal-cancel-button')).click();
}

function removeMessage() {
    return element(by.css('#message-0 button')).click();
}

function expectObjectCreatedSuccessfully(identifier){
    expect(element(by.id('object-overview-identifier-0')).getText()).toEqual(identifier);
    expectMsg("erfolgreich");
}

function expectMsg(partialMsg){
    expect(element(by.id('message-0')).getText())
        .toContain(partialMsg);
}

module.exports = {
    removeMessage: removeMessage,
    clickCancelInModal: clickCancelInModal,
    clickSaveInModal: clickSaveInModal,
    clickCreateObjectButton: clickCreateObjectButton,
    selectObjectType: selectObjectType,
    chooseGeometry: chooseGeometry,
    createObject: createObject,
    switchToEditMode: switchToEditMode,
    saveObject: saveObject,
    selectObject: selectObject,
    typeInIdentifier: typeInIdentifier,
    typeIn: typeIn,
    scrollUp: scrollUp,
    scrollDown: scrollDown,
    expectObjectCreatedSuccessfully: expectObjectCreatedSuccessfully,
    expectMsg: expectMsg,
    gotoView: gotoView
};
