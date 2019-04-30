import {browser, protractor, element, by} from 'protractor';
import {ResourcesPage} from '../resources/resources.page';

const common = require('../common.js');
const EC = protractor.ExpectedConditions;
const delays = require('../config/delays');

/**
 * @author Daniel de Oliveira
 */
export class GeometryViewPage {

    public static clickGeometryTab() {

        return common.click(element(by.id('document-view-geometry-tab')));
    }


    public static clickCreateGeometry(type) {

        this.clickGeometryTab();
        return common.click(element(by.id('document-view-button-create-' + type)));
    };


    public static clickReeditGeometry() {

        this.clickGeometryTab();
        common.click(element(by.id('document-view-button-edit-geometry')));
    };


    public static getSelectedGeometryTypeText(identifier?) {

        if (identifier) ResourcesPage.clickOpenContextMenu(identifier);
        browser.wait(EC.visibilityOf(element(by.css('#context-menu #context-menu-edit-geo-button'))), delays.ECWaitTime);
        return element(by.css('#context-menu #context-menu-edit-geo-button')).element(by.css('.fieldvalue')).getText();
    };
}