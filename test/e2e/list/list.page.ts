import {browser,protractor,element,by} from 'protractor';

'use strict';
let common = require("../common.js");
let EC = protractor.ExpectedConditions;
let delays = require('../config/delays');


let ListPage = function() {

    this.get = function() {
        return browser.get('#/list');
    };

    this.getListItemEl = function(identifier) {
        return element(by.id('resource-' + identifier));
    };

    this.getTrenchFilterItem = function(identifier) {
        return element(by.id('trench-' + identifier));
    };

    this.typeIntoIdentifierInputForResource = function(identifier, text) {
        common.typeIn(element(by.css('#resource-'+ identifier+' .identifier-input')), text);

    };
};

module.exports = new ListPage();