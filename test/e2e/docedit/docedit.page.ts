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


    private static clickSaveInModal() {

        common.click(element(by.id('overview-save-confirmation-modal-save-button')));
        browser.wait(EC.stalenessOf(element(by.id('document-edit-wrapper'))));
    }


    private static clickCancelInModal() {

        common.click(element(by.id('overview-save-confirmation-modal-cancel-button')));
    }


    private static clickDiscardInModal() {

        common.click(element(by.id('overview-save-confirmation-modal-discard-button')));
        browser.wait(EC.stalenessOf(element(by.id('document-edit-wrapper'))));
    }


     public static clickCloseEdit(action?: 'discard' | 'cancel' | 'save') {

        browser.wait(EC.visibilityOf(element(by.id('document-edit-button-goto-view'))), delays.ECWaitTime);
        element(by.id('document-edit-button-goto-view')).click();

        if (action === 'discard') this.clickDiscardInModal();
        if (action === 'cancel') this.clickCancelInModal();
        if (action === 'save') this.clickSaveInModal();
    };


    public static clickFieldsTab() {

        common.click(element(by.id('docedit-fields-tab')));
    };


    public static clickGotoTimeTab() {

        common.click(element(by.id('edit-form-goto-time')));
    };


    public static clickGotoPropertiesTab() {

        common.click(element(by.id('edit-form-goto-properties')));
    }


    public static clickGotoChildPropertiesTab() {

        common.click(element(by.id('edit-form-goto-childProperties')));
    }


    public static clickGotoImagesTab() {

        common.click(element(by.id('edit-form-goto-images')));
    }


    public static clickImagesTab() {

        common.click(element(by.id('docedit-images-tab')));
    };


    public static clickConflictsTab() {

        common.click(element(by.id('docedit-conflicts-tab')));
    };


    public static clickSaveDocument(clickMsgAway: boolean = true, waitForModalToClose: boolean = true) {

        return browser.wait(EC.visibilityOf(element(by.id('document-edit-button-save-document'))), delays.ECWaitTime)
            .then(function() {
                element(by.id('document-edit-button-save-document')).click().then(
                    function() {
                        return new Promise(function(resolve) {
                            setTimeout(function() {
                                if (clickMsgAway)
                                    NavbarPage.clickCloseAllMessages().then(() => resolve());
                                else resolve();
                            }, delays.shortRest / 5);
                        })
                    }
                )
            }).then(() => {
                if (waitForModalToClose) {
                    browser.wait(EC.stalenessOf(element(by.id('document-edit-wrapper'))));
                }
            });
    };


    public static clickDuplicateDocument() {

        common.click(element(by.id('document-edit-button-dropdown')));
        common.click(element(by.id('document-edit-button-duplicate-document')));
    };


    public static clickConfirmDuplicateInModal() {

        common.click(element(by.id('duplicate-confirm')));
        browser.wait(EC.stalenessOf(element(by.id('document-edit-wrapper'))));
    };


    public static clickChooseRightRevision() {

        browser.wait(EC.visibilityOf(element.all(by.css('input[type=radio]')).get(1)), delays.ECWaitTime);
        element.all(by.css('input[type=radio]')).get(1).click();
    };


    public static clickSolveConflictButton() {

        browser.wait(EC.visibilityOf(element(by.id('solve-conflict-button'))), delays.ECWaitTime);
        element(by.id('solve-conflict-button')).click();
    };


    public static clickTypeSwitcherButton() {

        browser.wait(EC.visibilityOf(element(by.id('type-switcher-button'))), delays.ECWaitTime);
        element(by.id('type-switcher-button')).click();
    };


    public static clickTypeSwitcherOption(typeName: string) {

        browser.wait(EC.visibilityOf(element(by.id('choose-type-option-' + typeName))), delays.ECWaitTime);
        element(by.id('choose-type-option-' + typeName)).click();
    };


    public static clickSelectOption(fieldName: string, optionIndex: number) {

        browser.wait(EC.visibilityOf(element(by.css('#edit-form-element-' + fieldName + ' select'))),
            delays.ECWaitTime);
        element.all(by.css('#edit-form-element-' + fieldName + ' select option')).get(optionIndex).click();
    };


    public static clickBooleanRadioButton(fieldName: string, radioButtonIndex: number) {

        browser.wait(EC.visibilityOf(element(by.id('edit-form-element-' + fieldName))), delays.ECWaitTime);
        element.all(by.css('#edit-form-element-' + fieldName + ' input')).get(radioButtonIndex).click();
    }


    // get text

    public static getInputFieldValue(index) {

        browser.wait(EC.visibilityOf(element.all(by.tagName('dai-input input')).get(index)), delays.ECWaitTime);
        return element.all(by.tagName('dai-input input')).get(index).getAttribute('value');
    };


    // elements

    public static getNumberOfDuplicatesInputField() {

        return element(by.id('duplicate-input'));
    }


    // type in

    public static typeInInputField(fieldName: string, text: string) {

        browser.wait(EC.visibilityOf(element(by.css('#edit-form-element-' + fieldName + ' input'))),
            delays.ECWaitTime);
        common.typeIn(element(by.css('#edit-form-element-' + fieldName + ' input')), text);
    };


    public static typeInNumberOfDuplicates(numberOfDuplicates: string) {

        return common.typeIn(this.getNumberOfDuplicatesInputField(), numberOfDuplicates);
    }
}