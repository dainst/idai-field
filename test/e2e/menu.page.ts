import {element, by, Key} from 'protractor';


export class MenuPage {

    public static navigateToSettings() {

        element(by.tagName('body')).sendKeys(Key.CONTROL, Key.ALT, 's');
    }


    public static navigateToImport() {

        element(by.tagName('body')).sendKeys(Key.CONTROL, 'i');
    }


    public static navigateToImages() {

        element(by.tagName('body')).sendKeys(Key.CONTROL, Key.ALT, 'b');
    }
}