"use strict";
var Protractor_1 = require("Protractor");
var delays = require('../../config/delays');
var EC = Protractor_1.protractor.ExpectedConditions;
var MapPage = function () {
    var mapElement = Protractor_1.element(Protractor_1.by.id("map-container"));
    this.clickMap = function (x, y) {
        return new Promise(function (resolve) {
            return Protractor_1.browser.wait(EC.visibilityOf(Protractor_1.element(Protractor_1.by.id('map-container'))), delays.ECWaitTime)
                .then(function () {
                Protractor_1.browser.actions()
                    .mouseMove(mapElement, { x: x, y: y })
                    .click()
                    .perform()
                    .then(function () {
                    setTimeout(function () {
                        resolve();
                    }, delays.shortRest);
                });
            });
        });
    };
    this.setMarker = function (x, y) {
        return this.clickMap(x, y);
    };
    this.setPolygon = function (pointArray) {
        var _this = this;
        return function () {
            for (var i = 0; i < pointArray.length; ++i) {
                _this.clickMap(pointArray[i][0], pointArray[i][1]);
            }
        };
    };
    this.clickMapOption = function (optionName) {
        Protractor_1.browser.wait(EC.presenceOf(Protractor_1.element(Protractor_1.by.id('map-editor-button-' + optionName))), delays.ECWaitTime);
        return Protractor_1.element(Protractor_1.by.id('map-editor-button-' + optionName)).click();
    };
};
module.exports = new MapPage();
