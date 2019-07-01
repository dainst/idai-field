import {browser, protractor, element, by} from 'protractor';
import {ResourcesPage} from '../resources/resources.page';

type Identifier = string;

const common = require('../common.js');
const EC = protractor.ExpectedConditions;
const delays = require('../config/delays');

/**
 * @author Daniel de Oliveira
 */
export class GeometryViewPage {


    public static clickCreateGeometry(identifier, type) {

        let number = '0';
        if (type === 'polygon') number = '1';
        if (type === 'polyline') number = '2';
        if (type === 'point') number = '3';

        ResourcesPage.clickOpenContextMenu(identifier);
        browser.wait(EC.visibilityOf(element(by.css('#context-menu #context-menu-create-geo-' + number + '-button'))), delays.ECWaitTime);
        return common.click(element(by.css('#context-menu #context-menu-create-geo-' + number + '-button')));
    };


    public static performReeditGeometry(identifier?: Identifier) {

        if (identifier) ResourcesPage.clickOpenContextMenu(identifier);
        browser.wait(EC.visibilityOf(element(by.css('#context-menu #context-menu-edit-geo-button'))), delays.ECWaitTime);
        common.click(element(by.css('#context-menu #context-menu-edit-geo-button')));
    };


    public static getSelectedGeometryTypeText(identifier: Identifier) {

        if (identifier) ResourcesPage.clickOpenContextMenu(identifier);
        browser.wait(EC.visibilityOf(element(by.css('#context-menu #context-menu-edit-geo-button'))), delays.ECWaitTime);
        return element(by.css('#context-menu #context-menu-edit-geo-button')).element(by.css('.fieldvalue')).getText();
    };


    public static waitForCreateGeoButtons(identifier: Identifier) {

        if (identifier) ResourcesPage.clickOpenContextMenu(identifier);
        browser.wait(EC.visibilityOf(element(by.css('#context-menu #context-menu-create-geo-1-button'))), delays.ECWaitTime);
        browser.wait(EC.visibilityOf(element(by.css('#context-menu #context-menu-create-geo-2-button'))), delays.ECWaitTime);
        browser.wait(EC.visibilityOf(element(by.css('#context-menu #context-menu-create-geo-3-button'))), delays.ECWaitTime);
    };
}