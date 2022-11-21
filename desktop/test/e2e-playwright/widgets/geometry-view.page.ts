import { click, getText, waitForNotExist, waitForExist } from '../app';
import { ResourcesPage } from '../resources/resources.page';


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


    public static async performReeditGeometry(identifier?: string) {

        await this.waitForLayoverToDisappear();

        if (identifier) await ResourcesPage.clickOpenContextMenu(identifier);
        return click('#context-menu #context-menu-edit-geo-button');
    };


    public static async getSelectedGeometryTypeText(identifier: string) {

        await this.waitForLayoverToDisappear();

        if (identifier) await ResourcesPage.clickOpenContextMenu(identifier);
        return getText('#context-menu #context-menu-edit-geo-button .fieldvalue');
    };


    public static async waitForCreateGeoButtons(identifier: string) {

        await this.waitForLayoverToDisappear();

        if (identifier) await ResourcesPage.clickOpenContextMenu(identifier);
        await waitForExist('#context-menu #context-menu-create-geo-1-button');
        await waitForExist('#context-menu #context-menu-create-geo-2-button');
        return waitForExist('#context-menu #context-menu-create-geo-3-button');
    };


    public static waitForLayoverToDisappear() {

        return waitForNotExist('.layover2');
    }
}
