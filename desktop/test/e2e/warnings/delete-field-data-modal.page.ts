import { click } from '../app';


/**
 * @author Thomas Kleinke
 */
export class DeleteFieldDataModalPage {

    // click

    public static async clickConfirmButton() {

        return click('#confirm-deletion-button');
    }
}
