import {element, by, Key} from 'protractor';


/*
 * Important: Every shortcut has to be configured in AppComponent to make it work in e2e tests.
 */
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


    public static navigateToTypes() {

        element(by.tagName('body')).sendKeys(Key.CONTROL, 't');
    }


    public static navigateToMatrix() {

        element(by.tagName('body')).sendKeys(Key.CONTROL, 'y');
    }
}