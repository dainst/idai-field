import {browser,protractor,element,by} from 'protractor';
let EC = protractor.ExpectedConditions;
let delays = require('./config/delays');


export class NavbarPage {

    // click

    public static clickNavigateToResources() {
        browser.wait(EC.visibilityOf(element(by.css('navbar ul li:nth-child(1)'))), delays.ECWaitTime);
        element(by.css('navbar ul li:nth-child(1)')).click();
    };

    // await

    public static awaitAlert (text,matchExactly=true) {
        if (matchExactly) {
            browser.wait(EC.presenceOf(element(by.xpath("//span[@class='content' and normalize-space(text())='"+text+"']"))), delays.ECWaitTime);
        }
        else {
            browser.wait(EC.presenceOf(element(by.xpath("//span[@class='content' and contains(text(),'"+text+"')]"))), delays.ECWaitTime);
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
}