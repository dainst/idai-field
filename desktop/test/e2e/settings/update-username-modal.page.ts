import { click, getLocator, typeIn } from '../app';


/**
 * @author Thomas Kleinke
 */
export class UpdateUsernameModalPage {

    public static clickConfirm() {

        return click('#confirm-button');
    }


    public static getBody() {

        return getLocator('#update-username-modal-body');
    }


    public static typeInUsername(username: string) {

        return typeIn('#username-modal-input', username);
    }
}
