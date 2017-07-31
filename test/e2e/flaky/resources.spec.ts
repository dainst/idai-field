import {browser, by, element, protractor} from "protractor";
import {ResourcesPage} from "../resources/resources.page";

let EC = protractor.ExpectedConditions;
let delays = require('../config/delays');


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('resources --', () => {


    beforeEach(() => {
        ResourcesPage.get();
        browser.wait(EC.visibilityOf(element(by.id('create-main-type-document-button'))), delays.ECWaitTime);
    });

    it('should delete a main type resource', () => {
        ResourcesPage.performCreateMainTypeResource('newTrench');
        ResourcesPage.getListItemEls().then(elements => expect(elements.length).toBe(0));
        ResourcesPage.clickEditMainTypeResource();
        ResourcesPage.clickDeleteDocument();
        ResourcesPage.clickDeleteInModal();
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value[0]).toContain('trench1'));
        ResourcesPage.getListItemEls().then(elements => expect(elements.length).toBeGreaterThan(0));
        ResourcesPage.clickEditMainTypeResource();
        ResourcesPage.clickDeleteDocument();
        ResourcesPage.clickDeleteInModal();
        browser.sleep(2000);
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value.length).toBe(0));
        ResourcesPage.getListItemEls().then(elements => expect(elements.length).toBe(0));
    });
});
