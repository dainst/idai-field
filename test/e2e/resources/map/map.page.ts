import {browser, protractor, element, by} from 'protractor';

let delays = require('../../config/delays');
let EC = protractor.ExpectedConditions;

export class MapPage {

    public static clickMap = function(x, y) {
        return new Promise(function(resolve){
            return browser.wait(EC.visibilityOf(element(by.id('map-container'))), delays.ECWaitTime)
                .then(function() {
                    browser.actions()
                        .mouseMove(element(by.id("map-container")), {x: x, y: y})
                        .click()
                        .perform()
                        .then(function () {
                            setTimeout(function () {
                                resolve()
                            }, delays.shortRest)
                        })
                })
        });
    };

    public static setMarker = function (x, y) {
        return this.clickMap(x, y);
    };

    public static setPolygon = function (pointArray) {
        const _this = this;
        return function () {
            for(let i = 0; i < pointArray.length; ++i){
                _this.clickMap(pointArray[i][0], pointArray[i][1]);
            }
        }
    };

    public static getMapOption = function(optionName) {
        return element(by.id('map-editor-button-' + optionName));
    };

    public static clickMapOption = function(optionName) {
        browser.wait(EC.presenceOf(MapPage.getMapOption(optionName)), delays.ECWaitTime);
        return MapPage.getMapOption(optionName).click();
    };
}