import {browser,protractor,element,by} from 'protractor';

'use strict';

export class ImagesViewPage {
    public static getDocumentCard = function () {
        return element(by.id('document-view'));
    };
    public static clickBackToGridButton = function () {
        return element(by.id('document-view-button-back-to-map')).click();
    };
}