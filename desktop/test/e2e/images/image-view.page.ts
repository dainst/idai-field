import { click, getElements, getText } from '../app';


export module ImageViewPage {

    export function editDocument() {

        return click('.mdi-pencil');
    }


    export function clickCloseButton() {

        return click('#close-button');
    }


    export async function openRelationsTab() {

        return click((await getElements('.card-header'))[3]);
    }


    export async function clickRelation() {

        return click((await getElements('.resources-listing-item'))[0]);
    }


    export function getIdentifier() {

        return getText('.identifier-label');
    }
}
