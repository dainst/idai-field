'use strict';



var MapPage = function () {

    var mapElement = element(by.id("map-container"));

    this.clickMap = function(x, y) {
        return browser.actions().mouseMove(mapElement, {x: x}, {y: y}).click().perform();
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