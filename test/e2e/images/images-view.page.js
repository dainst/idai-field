'use strict';

module.exports = {
    getDocumentCard: function () {
        return element(by.id('document-view'));
    },
    clickBackToGridButton: function () {
        return element(by.id('document-view-button-back-to-map')).click();
    }
};