import { click, getLocator, rightClick, typeIn } from '../app';


/**
 * @author Thomas Kleinke
 */
export class ManageValuelistsModalPage {

    // click

    public static async clickSelectValuelist(valuelistName: string) {

        return click(await this.getSelectValuelistButton(valuelistName));
    }


    public static async clickOpenContextMenu(valuelistName: string) {

        return rightClick(await this.getSelectValuelistButton(valuelistName));
    }


    public static clickContextMenuExtendOption() {

        return click('#context-menu-extend-button');
    }


    public static clickConfirmSelection() {

        return click('#confirm-valuelist-selection-button');
    }


    public static clickCreateNewValuelist() {

        return click('#new-valuelist-button');
    }


    public static clickFilterButton() {

        return click('#valuelist-filter-button');
    }


    public static clickToggleCustomFilter() {

        return click('#custom-filter');
    }


    public static clickToggleInUseFilter() {

        return click('#in-use-filter');
    }

    
    public static clickConfirmValuelistExtension() {

        return click('#confirm-valuelist-extension-button');
    }


    public static clickCancel() {

        return click('#cancel-manage-valuelists-modal-button');
    }


    // get

    public static getSelectValuelistButton(valuelistId: string) {

        return getLocator('#valuelist-' + valuelistId.replace(':', '-'));
    }


    // type in

    public static typeInSearchFilterInput(text: string) {

        return typeIn('#valuelist-search-input', text);
    }


    public static typeInValuelistExtensionName(text: string) {

        return typeIn('#valuelist-extension-name', text);
    }
}
