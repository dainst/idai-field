'use strict';

var ImagesViewPage = function (){
    this.getDocumentCard = function () {
        return element(by.id('document-view'));
    };
    this.clickBackToGridButton = function () {
        return element(by.id('document-view-button-back-to-map')).click();
    };
};

module.exports = new ImagesViewPage();