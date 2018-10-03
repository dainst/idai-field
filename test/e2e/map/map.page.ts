import {browser, protractor, element, by} from 'protractor';

let delays = require('../config/delays');
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
                        .then(() => {
                            setTimeout(() => {
                                resolve()
                            }, delays.shortRest)
                        })
                })
        });
    };


    public static setMarker = function(x, y) {

        return this.clickMap(x, y);
    };


    public static getMapOption = function(optionName) {

        return element(by.id('map-editor-button-' + optionName));
    };


    public static clickMapOption = function(optionName) {

        browser.wait(EC.presenceOf(MapPage.getMapOption(optionName)), delays.ECWaitTime);
        return MapPage.getMapOption(optionName).click();
    };


    public static getLayerButton() {

        return element(by.id('layer-button'));
    }
}