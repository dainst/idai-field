import { click, getLocator, waitForExist, waitForNotExist } from './app';


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


    export async function waitForCells() {

        return waitForExist((await getLocator('.cell')).nth(0));
    }


    export async function clickDeleteImages() {

        await click('#delete-images');
        return waitForNotExist('#saving-link-changes-modal');
    }


    export function getCells() {

        return getLocator('.cell');
    }
}
