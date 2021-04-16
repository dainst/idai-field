import { click, getElement } from '../app';


export class MapPage {

    public static clickMap(x, y) {

        return new Promise(function(resolve){
            /*return browser.wait(EC.visibilityOf(element(by.id('map-container'))), delays.ECWaitTime)
                .then(function() {
                    browser.actions()
                        .mouseMove(element(by.id("map-container")), {x: x, y: y})
                        .click()
                        .perform()
                        .then(() => {
                            setTimeout(() => {
                                resolve(undefined)
                            }, delays.shortRest)
                        })
                })*/
        });
    };


    public static setMarker(x, y) {

        return this.clickMap(x, y);
    };


    public static getMapOption(optionName) {

        return getElement('#map-editor-button-' + optionName);
    };


    public static async clickMapOption(optionName) {

        return click(await MapPage.getMapOption(optionName));
    };


    public static getLayerButton() {

        return getElement('#layer-button');
    }
}
