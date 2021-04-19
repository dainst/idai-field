import { click, getElement } from '../app';


export class MapPage {

    public static async clickMap(x, y) {

        return click('#map-container', x, y);
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
