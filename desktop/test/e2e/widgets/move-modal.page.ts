import { click, getLocator, typeIn } from '../app';


/**
 * @author Thomas Kleinke
 */
export class MoveModalPage {

    // click

    public static clickResourceListItem(identifier: string) {

        return click('#document-picker-resource-' + identifier);
    }
    
    
    public static clickCancel() {
    
        return click('#move-modal-cancel-button');
    }


    // get

    public static getModal() {

        return getLocator('#move-modal');
    }


    public static getResourceIdentifierLabels() {

        return getLocator('#move-modal document-teaser .title');
    }


    public static getNoResourcesFoundInfo() {

        return getLocator('.no-resources-found-info');
    }


    // type in

    public static typeInSearchBarInput(identifier: string) {

        return typeIn('#move-modal .search-bar-input', identifier);
    }
}
