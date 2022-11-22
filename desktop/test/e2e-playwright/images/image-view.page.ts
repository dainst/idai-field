import { click, getLocator, getText } from '../app';


export module ImageViewPage {

    export function editDocument() {

        return click('.mdi-pencil');
    }


    export function clickCloseButton() {

        return click('#close-button');
    }


    export async function openRelationsTab() {

        return click((await getLocator('.card-header')).nth(3));
    }


    export async function clickRelation() {

        return click((await getLocator('.resources-listing-item')).nth(0));
    }


    export function getIdentifier() {

        return getText('.identifier-label');
    }
}
