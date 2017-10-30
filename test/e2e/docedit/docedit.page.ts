import {browser, protractor, element, by} from 'protractor';
import {NavbarPage} from '../navbar.page';

let common = require('../common.js');
let delays = require('../config/delays');
let EC = protractor.ExpectedConditions;

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class DoceditPage {

     public static clickCloseEdit() {

        browser.wait(EC.visibilityOf(element(by.id('document-edit-button-goto-view'))), delays.ECWaitTime);
        element(by.id('document-edit-button-goto-view')).click();
    };

    public static clickFieldsTab = function() {

        common.click(element(by.id('docedit-fields-tab')));
    };

    public static clickRelationsTab = function() {

        common.click(element(by.id('docedit-relations-tab')));
    };

    public static clickImagesTab = function() {

        common.click(element(by.id('docedit-images-tab')));
    };

    public static clickConflictsTab = function() {

        common.click(element(by.id('docedit-conflicts-tab')));
    };

    public static clickSaveDocument = function() {

        return browser.wait(EC.visibilityOf(element(by.id('document-edit-button-save-document'))), delays.ECWaitTime)
            .then(function() {
                element(by.id('document-edit-button-save-document')).click().then(
                    function() {
                        return new Promise(function(resolve) {
                            setTimeout(function() {
                                NavbarPage.clickCloseMessage();
                                resolve();
                            }, delays.shortRest);
                        })
                    }
                )
            });
    };

    public static clickDeleteDocument() {

        common.click(element(by.id('document-edit-button-delete-document')));
    };

    public static clickConfirmDeleteInModal = function() {

        common.click(element(by.id('delete-resource-confirm')));
    };

    public static clickChooseRightRevision = function() {

        browser.wait(EC.visibilityOf(element.all(by.css('input[type=radio]')).get(1)), delays.ECWaitTime);
        element.all(by.css('input[type=radio]')).get(1).click();
    };

    public static clickSolveConflictButton = function() {

        browser.wait(EC.visibilityOf(element(by.id('solve-conflict-button'))), delays.ECWaitTime);
        element(by.id('solve-conflict-button')).click();
    };

    public static clickTypeSwitcherButton = function() {

        browser.wait(EC.visibilityOf(element(by.id('type-switcher-button'))), delays.ECWaitTime);
        element(by.id('type-switcher-button')).click();
    };

    public static clickTypeSwitcherOption = function(typeName: string) {

        browser.wait(EC.visibilityOf(element(by.id('choose-type-option-' + typeName))), delays.ECWaitTime);
        element(by.id('choose-type-option-' + typeName)).click();
    };

    public static clickSelectOption(fieldName: string, optionIndex: number) {

        browser.wait(EC.visibilityOf(element(by.css('#edit-form-element-' + fieldName + ' select'))),
            delays.ECWaitTime);
        element.all(by.css('#edit-form-element-' + fieldName + ' select option')).get(optionIndex).click();
    };

    // get text

    public static getInputFieldValue = function(index) {

        browser.wait(EC.visibilityOf(element.all(by.tagName('dai-input input')).get(index)), delays.ECWaitTime);
        return element.all(by.tagName('dai-input input')).get(index).getAttribute('value');
    };

    // elements

    public static getConfirmDeletionInputField() {

        return element(by.id('delete-resource-input'));
    }

    // type in

    public static typeInInputField = function(fieldName: string, text: string) {

        browser.wait(EC.visibilityOf(element(by.css('#edit-form-element-' + fieldName + ' input'))),
            delays.ECWaitTime);
        common.typeIn(element(by.css('#edit-form-element-' + fieldName + ' input')), text);
    };

    public static typeInIdentifierInConfirmDeletionInputField(identifier) {

        return common.typeIn(this.getConfirmDeletionInputField(), identifier);
    }
}