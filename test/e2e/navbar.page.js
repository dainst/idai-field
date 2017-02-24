"use strict";
var Protractor_1 = require("Protractor");
'use strict';
var EC = Protractor_1.protractor.ExpectedConditions;
var delays = require('./config/delays');
var NavbarPage = function () {
    // click
    this.clickNavigateToResources = function () {
        Protractor_1.browser.wait(EC.visibilityOf(Protractor_1.element(Protractor_1.by.css('navbar ul li:nth-child(1)'))), delays.ECWaitTime);
        Protractor_1.element(Protractor_1.by.css('navbar ul li:nth-child(1)')).click();
    };
};
module.exports = new NavbarPage();
//# sourceMappingURL=navbar.page.js.map