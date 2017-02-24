import {browser,protractor,element,by} from 'protractor';


'use strict';
var EC = protractor.ExpectedConditions;
var delays = require('./config/delays');


var NavbarPage = function() {

    // click

    this.clickNavigateToResources = function () {
        browser.wait(EC.visibilityOf(element(by.css('navbar ul li:nth-child(1)'))), delays.ECWaitTime);
        element(by.css('navbar ul li:nth-child(1)')).click();
    };
};

module.exports = new NavbarPage();