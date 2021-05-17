import { click, getElements, waitForExist } from './app';


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


    export function waitForCells() {

        return waitForExist('.cell');
    }


    export function clickDeleteImages() {

        return click('#delete-images');
    }


    export function getCells() {

        return getElements('.cell');
    }
}
