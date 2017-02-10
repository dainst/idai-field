'use strict';
var delays = require('../config/delays');
var EC = protractor.ExpectedConditions;

var afterClickPauseTime = 150;

var MapPage = function () {

    var mapElement = element(by.id("map-container"));

    this.clickMap = function(x, y) {
        return new Promise(function(resolve){
            return browser.wait(EC.visibilityOf(element(by.id('map-container'))), delays.ECWaitTime)
                .then(function() {
                    browser.actions()
                        .mouseMove(mapElement, {x: x, y: y})
                        .click()
                        .perform()
                        .then(function () {
                            setTimeout(function () {
                                resolve()
                            }, afterClickPauseTime)
                        })
                })
        });
    };

    this.setMarker = function (x, y) {
        return this.clickMap(x, y);
    };

    this.setPolygon = function (pointArray) {
        var _this = this;
        return function () {
            for(var i = 0; i < pointArray.length; ++i){
                _this.clickMap(pointArray[i][0], pointArray[i][1]);
            }
        }
    };

    this.clickMapOption = function(optionName) {
        return element(by.id('map-editor-button-'+optionName)).click();
    };
};

module.exports = new MapPage();