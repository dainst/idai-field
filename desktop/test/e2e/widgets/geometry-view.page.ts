import { click, getText, waitForNotExist, waitForExist } from '../app';
import { ResourcesPage } from '../resources/resources.page';


/**
 * @author Daniel de Oliveira
 */
export class GeometryViewPage {

    public static async clickCreateGeometry(identifier, type) {

        await this.waitForLayoverToDisappear();
        await ResourcesPage.clickOpenContextMenu(identifier);
        return click('#context-menu #context-menu-create-' + type + '-button');
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
        await waitForExist('#context-menu #context-menu-create-polygon-button');
        await waitForExist('#context-menu #context-menu-create-polyline-button');
        return waitForExist('#context-menu #context-menu-create-point-button');
    };


    public static waitForLayoverToDisappear() {

        return waitForNotExist('.layover2');
    }
}
