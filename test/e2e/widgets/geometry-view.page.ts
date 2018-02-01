import {browser, protractor, element, by} from 'protractor';


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


    public static getSelectedGeometryTypeText() {

        GeometryViewPage.clickGeometryTab();
        browser.wait(EC.visibilityOf(element(by.css('#document-view-field-geometry .fieldvalue'))), delays.ECWaitTime);
        return element(by.id('document-view-field-geometry')).element(by.css('.fieldvalue')).getText();
    };
}