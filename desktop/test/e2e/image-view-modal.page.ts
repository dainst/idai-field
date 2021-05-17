import { click } from './app';

export namespace ImageViewModalPage {

    export function clickPlusButton() {

        return click('#plus-button');
    }


    export function clickLinkImagesButton() {

        return click('#link-images-button');
    }


    export function clickCloseButton() {

        return click('#close-button');
    }
}
