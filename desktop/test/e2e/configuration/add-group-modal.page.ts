import { click, typeIn } from '../app';


/**
 * @author Thomas Kleinke
 */
export class AddGroupModalPage {

    // click

    public static clickSelectGroup(groupName: string) {

        return click('#select-group-' + groupName.replace(':', '-'));
    }


    public static clickCreateNewGroup() {

        return click('#new-group-button');
    }


    public static clickConfirmSelection() {

        return click('#confirm-group-selection-button');
    }


    // type in

    public static typeInSearchFilterInput(text: string) {

        return typeIn('#group-name', text);
    }
}
