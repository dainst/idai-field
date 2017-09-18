import {element, by} from 'protractor';

export class ImagesViewPage {

    public static getDocumentCard = function () {

        return element(by.id('document-view'));
    };
    public static clickBackToGridButton = function () {

        return element(by.id('document-view-button-back-to-map')).click();
    };
}