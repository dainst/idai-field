import { click, getLocator, waitForNotExist } from '../app';


export class MapPage {

    public static async clickMap(x, y) {

        return click('#map-container', x, y);
    };


    public static async clickLayerButton() {

        await waitForNotExist('.loading-icon');
        return click('#layer-button');
    }


    public static clickEditLayersButton() {

        return click('#layer-menu-edit-button');
    }


    public static clickAddLayersButton() {

        return click('.layer-menu-add-button');
    }


    public static clickRemoveLayerButton(layerIndex) {

        return click('#layer-menu-remove-button-' + layerIndex);
    }


    public static async clickSaveLayersButton() {

        await click('#layer-menu-save-button');
        return waitForNotExist('.loading-icon');
    }


    public static clickCancelEditingLayersButton() {

        return click('#layer-menu-cancel-button');
    }


    public static getLayerLabels(groupIndex) {

        return getLocator('#layer-group-' + groupIndex + ' .layer-menu-drag-handle .layer-menu-label');
    }


    public static setMarker(x, y) {

        return this.clickMap(x, y);
    };


    public static getMapOption(optionName) {

        return getLocator('#map-editor-button-' + optionName);
    };


    public static async clickMapOption(optionName) {

        return click(await MapPage.getMapOption(optionName));
    };
}
