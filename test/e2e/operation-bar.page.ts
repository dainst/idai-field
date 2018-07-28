import {browser, protractor, element, by} from 'protractor';

const EC = protractor.ExpectedConditions;
const delays = require('./config/delays');
const common = require('./common');

/**
 * @author Daniel de Oliveira
 */
export class OperationBarPage {

    public static clickSwitchHierarchyMode() {

        common.click(element(by.id('hierarchy-mode-switch')));
        browser.actions().mouseUp().mouseMove({ x: 200, y: 200 }).perform(); // avoid tooltip
    }


    public static performSelectOperation(index) {

        browser.wait(EC.presenceOf(element(by.css('.operation-document-selector'))), delays.ECWaitTime);
        element.all(by.css('.operation-document-selector .dropdown-toggle-split')).click();
        browser.wait(EC.presenceOf(element(by.css('.operation-document-selector .dropdown-menu'))),
            delays.ECWaitTime);
        element.all(by.css('.operation-document-selector .dropdown-menu button')).get(index).click();
    }
}