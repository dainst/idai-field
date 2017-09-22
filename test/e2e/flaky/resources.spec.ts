import {browser, protractor, element, by} from 'protractor';
import {DoceditPage} from '../docedit/docedit.page';
import {DocumentViewPage} from '../widgets/document-view.page';
import {ResourcesPage} from '../resources/resources.page';

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


    it('should delete invalid fields when changing the type of a resource to its parent type', () => {

        ResourcesPage.performCreateResource('1', 'feature-architecture');
        ResourcesPage.clickSelectResource('1');
        DocumentViewPage.clickEditDocument();

        DoceditPage.clickSelectOption(60, 1); // TODO we should avoid working with magic numbers. let's use meaningful css selectors instead
        // DoceditPage.clickSaveDocument();
        // DocumentViewPage.getFieldValue(0).then(fieldValue => expect(fieldValue).toEqual('Außenmauer'));
        // DocumentViewPage.clickEditDocument();
        // DoceditPage.clickTypeSwitcherButton();
        // DoceditPage.clickTypeSwitcherOption('feature');
        // NavbarPage.awaitAlert('Bitte beachten Sie, dass die Daten der folgenden Felder beim Speichern verloren ' +
        //     'gehen: Mauertyp');
        // NavbarPage.clickCloseMessage();
        // DoceditPage.clickSaveDocument();
        // DocumentViewPage.getTypeCharacter().then(typeLabel => expect(typeLabel).toEqual('S'));
        // browser.wait(EC.stalenessOf(DocumentViewPage.getFieldElement(0)));
    });
});
