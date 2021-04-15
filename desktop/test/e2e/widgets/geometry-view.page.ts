import { click, getElement, getText, waitForNotExist, waitForVisible } from '../app';
import {ResourcesPage} from '../resources/resources.page';

type Identifier = string;


/**
 * @author Daniel de Oliveira
 */
export class GeometryViewPage {


    public static async clickCreateGeometry(identifier, type) {

        let number = '0';
        if (type === 'polygon') number = '1';
        if (type === 'polyline') number = '2';
        if (type === 'point') number = '3';

        await this.waitForLayoverToDisappear();
        await ResourcesPage.clickOpenContextMenu(identifier);
        return click('#context-menu #context-menu-create-geo-' + number + '-button');
    };


    public static async performReeditGeometry(identifier?: Identifier) {

        await this.waitForLayoverToDisappear();

        if (identifier) await ResourcesPage.clickOpenContextMenu(identifier);
        return click('#context-menu #context-menu-edit-geo-button');
    };


    public static async getSelectedGeometryTypeText(identifier: Identifier) {

        await this.waitForLayoverToDisappear();

        if (identifier) await ResourcesPage.clickOpenContextMenu(identifier);
        const element = await getElement('#context-menu #context-menu-edit-geo-button');
        await waitForVisible(element);
        return getText(await element.$('.fieldvalue'));
    };


    public static async waitForCreateGeoButtons(identifier: Identifier) {

        await this.waitForLayoverToDisappear();

        if (identifier) await ResourcesPage.clickOpenContextMenu(identifier);
        await waitForVisible('#context-menu #context-menu-create-geo-1-button');
        await waitForVisible('#context-menu #context-menu-create-geo-2-button');
        return waitForVisible('#context-menu #context-menu-create-geo-3-button');
    };


    public static waitForLayoverToDisappear() {

        return waitForNotExist('.layover2');
    }
}
