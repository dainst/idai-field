import {browser, protractor, element, by} from 'protractor';
const EC = protractor.ExpectedConditions;
const delays = require('./config/delays');
const common = require('./common');

export class NavbarPage {

    // click

    public static clickNavigateToProject() {
        return common.click(element.all(by.css('.nav-link')).get(0));
    }

    public static clickNavigateToExcavation() {
        return common.click(element.all(by.css('.nav-link')).get(1));
    };

    public static clickNavigateToBuilding() {
        return common.click(element.all(by.css('.nav-link')).get(2));
    };

    public static clickNavigateToImages() {
        return common.click(element.all(by.css('.nav-link')).get(4));
    };

    public static clickNavigateToSettings() {
        return common.click(element.all(by.css('.nav-link')).get(7));
    };

    public static clickConflictsButton() {
        return common.click(element(by.id('taskbar-conflicts-button')));
    };

    public static clickConflictResolverLink(identifier) {
        return common.click(element(by.id('taskbar-conflict-' + identifier)));
    };

    public static clickSelectProject = function(option) {
        browser.wait(EC.presenceOf(element(by.id('projectSelectBox'))), delays.ECWaitTime);
        element.all(by.css('#projectSelectBox option')).get(option).click();
    };

    // unused?
    public static clickCloseMessage() {
        common.click(element(by.css('#message-0 button')));
    };

    // await

    public static awaitAlert(text, matchExactly = true) {
        if (matchExactly) {
            browser.wait(EC.presenceOf(element(by.xpath("//span[@class='message-content' and normalize-space(text())='"+text+"']"))), delays.ECWaitTime);
        }
        else {
            browser.wait(EC.presenceOf(element(by.xpath("//span[@class='message-content' and contains(text(),'"+text+"')]"))), delays.ECWaitTime);
        }
    };

    // get text

    public static getMessageText() {
        browser.sleep(200);
        browser.ignoreSynchronization = true;
        let text =  element(by.id('message-0')).getText();
        browser.ignoreSynchronization = false;
        return text;
    };

    public static getActiveNavLinkLabel() {
        browser.wait(EC.visibilityOf(element(by.css('.nav-link.active'))), delays.ECWaitTime);
        return element(by.css('.nav-link.active')).getText();
    }
}