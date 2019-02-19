import {browser, protractor, element, by} from 'protractor';
import {DoceditPage} from '../docedit/docedit.page';
import {SearchBarPage} from '../widgets/search-bar.page';
import {ResourcesPage} from './resources.page';
import {NavbarPage} from '../navbar.page';
import {DetailSidebarPage} from '../widgets/detail-sidebar.page';
import {FieldsViewPage} from '../widgets/fields-view-page';
import {RelationsViewPage} from '../widgets/relations-view.page';
import {DoceditRelationsTabPage} from '../docedit/docedit-relations-tab.page';
import {DoceditImageTabPage} from '../docedit/docedit-image-tab.page';
import {ThumbnailViewPage} from '../widgets/thumbnail-view.page';
import {ImagePickerModalPage} from '../widgets/image-picker-modal.page';
import {MapPage} from '../map/map.page';

const EC = protractor.ExpectedConditions;
const delays = require('../config/delays');
const common = require('../common');


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('resources --', () => {

    let i = 0;


    beforeAll(() => {

        ResourcesPage.get();
        browser.sleep(delays.shortRest * 4);
        ResourcesPage.clickHierarchyButton('S1');
    });


    beforeEach(async done => {

        if (i > 0) {
            NavbarPage.performNavigateToSettings();
            await common.resetApp();
            browser.sleep(delays.shortRest);
            NavbarPage.navigate('project');
            browser.sleep(delays.shortRest * 3);
            ResourcesPage.clickHierarchyButton('S1');
        }

        i++;
        done();
    });


    function gotoImageTab() {

        NavbarPage.navigate('images');
        NavbarPage.navigate('project');
        ResourcesPage.clickHierarchyButton('S1');
        ResourcesPage.openEditByDoubleClickResource('SE0');
        DoceditPage.clickImagesTab();
    }


    function addTwoImages() {

        gotoImageTab();
        DoceditImageTabPage.clickInsertImage();

        DoceditImageTabPage.waitForCells();
        ImagePickerModalPage.getCells().get(0).click();
        ImagePickerModalPage.getCells().get(1).click();
        ImagePickerModalPage.clickAddImages();
        DoceditPage.clickSaveDocument();
        browser.sleep(delays.shortSleep * 80);
    }


    it('docview -- show the relations present in the object', () => {

        ResourcesPage.performCreateLink();
        ResourcesPage.clickSelectResource('1');
        RelationsViewPage.getRelationName(0).then(value => {
            expect(value).toBe('Aufgenommen in Maßnahme');
        });
        RelationsViewPage.getRelationValue(0).then(value => {
            expect(value).toBe('S1');
        });
        RelationsViewPage.getRelationName(1).then(value => {
            expect(value).toBe('Zeitlich nach');
        });
        RelationsViewPage.getRelationValue(1).then(value => {
            expect(value).toBe('2');
        });
    });


    /**
     * Addresses an issue where relations were shown double.
     */
    it('docview -- show only relations present in the object', () => {

        ResourcesPage.performCreateLink();
        ResourcesPage.clickSelectResource('1');
        RelationsViewPage.getRelations().then(relations => {
            expect(relations.length).toBe(2);
        });
    });


    it('docview -- show the fields present in the object', () => {

        ResourcesPage.performCreateResource('1', 'feature-architecture',
            'area', '100');
        ResourcesPage.clickSelectResource('1');
        FieldsViewPage.getFieldName(0).then(value => {
            expect(value).toBe('Fläche in m2'); // with the correct field label
        });
        FieldsViewPage.getFieldValue(0).then(value => {
            expect(value).toBe('100');
        });
    });


    /**
     * Addresses an issue where fields were shown double.
     */
    it('docview -- show only the fields present in the object', () => {

        ResourcesPage.performCreateResource('1', 'feature-architecture',
            'area', '100');
        ResourcesPage.clickSelectResource('1');
        FieldsViewPage.getFields().then(items => {
            expect(items.length).toBe(1);
        });
    });


    /**
     * Addresses an issue where relations were still shown after cancelling edit and discarding changes
     * (they were not saved though).
     */
    it('docview -- do not show new relations after cancelling edit', () => {

        ResourcesPage.performCreateResource('1', 'feature-architecture');
        ResourcesPage.performCreateResource('2', 'feature-architecture');
        ResourcesPage.clickSelectResource('1');
        DetailSidebarPage.performEditDocument();
        DoceditPage.clickRelationsTab();
        DoceditRelationsTabPage.clickAddRelationForGroupWithIndex(0);
        DoceditRelationsTabPage.typeInRelationByIndices(0, 0, '2');
        DoceditRelationsTabPage.clickChooseRelationSuggestion(0, 0, 0);
        DoceditPage.clickCloseEdit();
        ResourcesPage.clickDiscardInModal();

        browser.wait(EC.visibilityOf(element(by.css('.detail-sidebar'))), delays.ECWaitTime);
        RelationsViewPage.getRelations().then(relations => {
            expect(relations.length).toBe(1);
        });
    });


    it('messages -- create a new resource of first listed type ', () => {

        ResourcesPage.performCreateResource('12',undefined,undefined,undefined,undefined,false);
        expect(NavbarPage.getMessageText()).toContain('erfolgreich');
    });


    it('messages -- show the success message after saving via modal', () => {

        ResourcesPage.performCreateResource('12',undefined,undefined,undefined,undefined,false);
        ResourcesPage.openEditByDoubleClickResource('12');
        DoceditPage.typeInInputField('identifier', '34');
        DoceditPage.clickCloseEdit();
        ResourcesPage.clickSaveInModal();

        expect(NavbarPage.getMessageText()).toContain('erfolgreich');
        NavbarPage.clickCloseAllMessages();
    });


    it('messages -- warn if identifier is missing', () => {

        browser.sleep(5000);

        ResourcesPage.performCreateResource('', 'feature',
            'shortDescription', 'Text', undefined,
            false, false);

        NavbarPage.awaitAlert('Bitte füllen Sie das Feld', false);
        NavbarPage.awaitAlert('Bezeichner', false);
        NavbarPage.clickCloseAllMessages();
        DoceditPage.clickCloseEdit();
        ResourcesPage.clickDiscardInModal();
    });


    it('messages -- warn if an existing identifier is used', () => {

        ResourcesPage.performCreateResource('12',undefined,undefined,
            undefined,undefined,false);
        ResourcesPage.performCreateResource('12',undefined,undefined,
            undefined,undefined,false, false);

        NavbarPage.awaitAlert('existiert bereits', false);
        NavbarPage.clickCloseAllMessages();
        DoceditPage.clickCloseEdit();
        ResourcesPage.clickDiscardInModal();
    });


    it('messages -- do not warn if two different identifiers start with the same string', () => {

        ResourcesPage.performCreateResource('120',undefined,undefined,
            undefined,undefined,false);
        ResourcesPage.performCreateResource('12',undefined,undefined,
            undefined,undefined,false, false);

        expect(NavbarPage.getMessageText()).toContain('erfolgreich');
    });


    it('docedit/images -- create links for images', done => {

        addTwoImages();
        ThumbnailViewPage.getThumbs().then(thumbs => {
            expect(thumbs.length).toBe(2);
            done();
        });
    });


    it('docedit/images -- delete links to one image', done => {

        addTwoImages();
        gotoImageTab();
        DoceditImageTabPage.waitForCells();
        DoceditImageTabPage.getCells().get(0).click();
        DoceditImageTabPage.clickDeleteImages();
        DoceditImageTabPage.getCells().then(cells => {
            expect(cells.length).toBe(1);
        });
        DoceditPage.clickSaveDocument();

        ThumbnailViewPage.getThumbs().then(thumbs => {
            expect(thumbs.length).toBe(1);
            done();
        });
    });


    it('docedit/images -- delete links to two images', done => {

        addTwoImages();
        gotoImageTab();
        DoceditImageTabPage.waitForCells();
        DoceditImageTabPage.getCells().get(0).click();
        DoceditImageTabPage.getCells().get(1).click();
        DoceditImageTabPage.clickDeleteImages();
        DoceditImageTabPage.getCells().then(cells => {
            expect(cells.length).toBe(0);
        });
        DoceditPage.clickSaveDocument();

        ThumbnailViewPage.getThumbs().then(thumbs => {
            expect(thumbs.length).toBe(0);
            done();
        });
    });


    // TODO Use context menu
    xit('delete a resource', () => {

        ResourcesPage.performCreateResource('1');
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('1')), delays.ECWaitTime);
        ResourcesPage.clickSelectResource('1');
        DetailSidebarPage.performEditDocument();
        DoceditPage.clickDeleteDocument();
        DoceditPage.typeInIdentifierInConfirmDeletionInputField('1');
        DoceditPage.clickConfirmDeleteInModal();
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('1')), delays.ECWaitTime);
    });


    // TODO Use context menu
    xit('delete an operation and update navbar', () => {

        NavbarPage.navigate('project');
        ResourcesPage.clickHierarchyButton('S1');
        NavbarPage.navigate('project');

        browser.wait(EC.presenceOf(element(by.id('navbar-t1'))), delays.ECWaitTime);

        ResourcesPage.openEditByDoubleClickResource('S1');
        DoceditPage.clickDeleteDocument();
        DoceditPage.typeInIdentifierInConfirmDeletionInputField('S1');
        DoceditPage.clickConfirmDeleteInModal();
        browser.sleep(delays.shortRest);
        NavbarPage.clickCloseAllMessages();

        browser.wait(EC.stalenessOf(element(by.id('navbar-t1'))), delays.ECWaitTime);
    });


    it('find a resource by its identifier', () => {

        ResourcesPage.performCreateResource('1');
        SearchBarPage.typeInSearchField('1');
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('1')), delays.ECWaitTime);
    });


    it('do not reflect changes in list while editing resource', () => {

        ResourcesPage.performCreateResource('1a');
        ResourcesPage.clickSelectResource('1a');
        DetailSidebarPage.performEditDocument();
        DoceditPage.typeInInputField('identifier', '1b');
        ResourcesPage.getSelectedListItemIdentifierText().then(identifier => {
            expect(identifier).toBe('1a');
        });
        DoceditPage.clickCloseEdit();
        ResourcesPage.clickDiscardInModal();
    });


    it('docedit/savedialog -- save changes via dialog modal', () => {

        ResourcesPage.performCreateResource('1');
        ResourcesPage.clickSelectResource('1');
        DetailSidebarPage.performEditDocument();
        DoceditPage.typeInInputField('identifier', '2');
        DoceditPage.clickCloseEdit();
        ResourcesPage.clickSaveInModal();

        ResourcesPage.getSelectedListItemIdentifierText().then(identifier => {
            expect(identifier).toBe('2');
        });
    });


    it('docedit/savedialog -- discard changes via dialog modal', () => {

        ResourcesPage.performCreateResource('1');
        ResourcesPage.clickSelectResource('1');
        DetailSidebarPage.performEditDocument();
        DoceditPage.typeInInputField('identifier', '2');
        DoceditPage.clickCloseEdit();
        ResourcesPage.clickDiscardInModal();

        ResourcesPage.getSelectedListItemIdentifierText().then(identifier => {
            expect(identifier).toBe('1');
        });
    });


    it('docedit/savedialog -- cancel dialog modal', () => {

        ResourcesPage.performCreateResource('1');
        ResourcesPage.clickSelectResource('1');
        DetailSidebarPage.performEditDocument();
        DoceditPage.typeInInputField('identifier', '2');
        DoceditPage.clickCloseEdit();
        ResourcesPage.clickCancelInModal();
        expect<any>(DoceditPage.getInputFieldValue(0)).toEqual('2');
        DoceditPage.clickCloseEdit();
        ResourcesPage.clickDiscardInModal();
    });


    it('relations -- create links for relations', () => {

        ResourcesPage.performCreateLink();
        ResourcesPage.clickSelectResource('1');
        RelationsViewPage.getRelationValue(1).then(relVal => expect(relVal).toEqual('2'));
        RelationsViewPage.clickRelation(1);
        RelationsViewPage.getRelationValue(1).then(relVal => expect(relVal).toEqual('1'));
    });


    it('relations -- create a new relation and the corresponding inverse relation', () => {

        ResourcesPage.performCreateLink();
        ResourcesPage.openEditByDoubleClickResource('2');
        expect(DoceditRelationsTabPage.getRelationButtonText(8, 0, 0))
            .toEqual('1');
        DoceditPage.clickCloseEdit();
        ResourcesPage.clickSelectResource('1');
        DetailSidebarPage.performEditDocument();
        expect(DoceditRelationsTabPage.getRelationButtonText(9, 0, 0))
            .toEqual('2');
        DoceditPage.clickCloseEdit();
    });


    it('relations -- edit a resource that contains a relation', () => {

        ResourcesPage.performCreateLink();
        ResourcesPage.openEditByDoubleClickResource('2');
        DoceditPage.clickFieldsTab();
        DoceditPage.typeInInputField('identifier', '123');
        DoceditPage.clickSaveDocument();
        // TODO expectation?
    });


    it('relations -- delete a relation and the corresponding inverse relation', () => {

        ResourcesPage.performCreateLink();
        ResourcesPage.clickSelectResource('1');
        RelationsViewPage.getRelations().then(relations => expect(relations.length).toBe(2));
        ResourcesPage.clickSelectResource('2');
        RelationsViewPage.getRelations().then(relations => expect(relations.length).toBe(2));
        DetailSidebarPage.performEditDocument();
        DoceditPage.clickRelationsTab();
        DoceditRelationsTabPage.clickRelationDeleteButtonByIndices(8, 0);
        DoceditPage.clickSaveDocument();
        RelationsViewPage.getRelations().then(relations => expect(relations.length).toBe(1));
        ResourcesPage.clickSelectResource('1');
        RelationsViewPage.getRelations().then(relations => expect(relations.length).toBe(1));
    });


    xit('relations -- delete inverse relations when deleting a resource', () => {

        ResourcesPage.performCreateLink();
        ResourcesPage.openEditByDoubleClickResource('2');
        DoceditPage.clickDeleteDocument();
        DoceditPage.typeInIdentifierInConfirmDeletionInputField('2');
        DoceditPage.clickConfirmDeleteInModal();
        browser.sleep(delays.shortRest);
        ResourcesPage.clickSelectResource('1');
        RelationsViewPage.getRelations().then(relations => expect(relations.length).toBe(1));
    });


    it('maintype -- create a new operation', () => {

        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('SE0')), delays.ECWaitTime);
        ResourcesPage.performCreateOperation('newTrench');
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('SE0')), delays.ECWaitTime);
        ResourcesPage.getListItemEls().then(elements => expect(elements.length).toBe(0));
        NavbarPage.getActiveNavLinkLabel().then(label => expect(label).toEqual('newTrench'));
    });


    it('maintype -- should edit a main type resource', () => {

        NavbarPage.navigate('project');
        ResourcesPage.openEditByDoubleClickResource('S1');
        DoceditPage.typeInInputField('identifier', 'newIdentifier');
        DoceditPage.clickSaveDocument();
        browser.sleep(delays.shortRest);
        NavbarPage.getNavLinkLabel('t1').then(label => expect(label).toEqual('newIdentifier'));
    });


    it('typechange -- should change the type of a resource to a child type', () => {

        ResourcesPage.performCreateResource('1', 'feature');
        ResourcesPage.clickSelectResource('1');
        DetailSidebarPage.performEditDocument();
        DoceditPage.clickTypeSwitcherButton();
        DoceditPage.clickTypeSwitcherOption('feature-architecture');
        browser.wait(EC.stalenessOf(element(by.id('message-0'))), delays.ECWaitTime);
        DoceditPage.clickSaveDocument();
        DetailSidebarPage.getTypeFromDocView().then(typeLabel => expect(typeLabel).toEqual('Architektur'));
    });


    it('typechange -- should delete invalid fields when changing the type of a resource to its parent type', () => {

        ResourcesPage.performCreateResource('1', 'feature-architecture');
        ResourcesPage.clickSelectResource('1');
        DetailSidebarPage.performEditDocument();

        DoceditPage.clickSelectOption('wallType', 1);
        DoceditPage.clickSaveDocument();
        browser.sleep(delays.shortRest);
        FieldsViewPage.getFieldValue(0).then(fieldValue => expect(fieldValue).toEqual('Außenmauer'));
        DetailSidebarPage.performEditDocument();
        DoceditPage.clickTypeSwitcherButton();
        DoceditPage.clickTypeSwitcherOption('feature');
        NavbarPage.awaitAlert('Bitte beachten Sie, dass die Daten der folgenden Felder beim Speichern verloren ' +
            'gehen: Mauertyp');
        NavbarPage.clickCloseAllMessages();
        DoceditPage.clickSaveDocument();
        DetailSidebarPage.getTypeFromDocView().then(typeLabel => expect(typeLabel).toEqual('Stratigraphische Einheit'));
        browser.wait(EC.stalenessOf(FieldsViewPage.getFieldElement(0)));
    });


    it('hide the new resource button while creating a new resource', () => {

        ResourcesPage.clickCreateResource();
        ResourcesPage.clickSelectResourceType();
        ResourcesPage.clickSelectGeometryType('point');
        ResourcesPage.getListItemMarkedNewEls().then(els => expect(els.length).toBe(1));
        browser.wait(EC.stalenessOf(ResourcesPage.getCreateDocumentButton()), delays.ECWaitTime);
    });


    it('remove new resource from list if docedit modal is canceled during resource creation', () => {

        ResourcesPage.clickCreateResource();
        ResourcesPage.clickSelectResourceType();
        ResourcesPage.clickSelectGeometryType('point');
        ResourcesPage.getListItemMarkedNewEls().then(els => expect(els.length).toBe(1));
        MapPage.clickMapOption('ok');
        DoceditPage.clickCloseEdit();
        ResourcesPage.getListItemMarkedNewEls().then(els => expect(els.length).toBe(0));
    });


    it('duplicate a resource', () => {

        ResourcesPage.performCreateResource('resource1', 'feature');
        ResourcesPage.openEditByDoubleClickResource('resource1');
        DoceditPage.clickDuplicateDocument();
        DoceditPage.typeInNumberOfDuplicates('2');
        DoceditPage.clickConfirmDuplicateInModal();

        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('resource1')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('resource2')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('resource3')), delays.ECWaitTime);
    });


    it('create two instances of a new resource', () => {

        ResourcesPage.clickCreateResource();
        ResourcesPage.clickSelectResourceType();
        ResourcesPage.clickSelectGeometryType();
        DoceditPage.typeInInputField('identifier', 'resource1');
        DoceditPage.clickDuplicateDocument();
        DoceditPage.typeInNumberOfDuplicates('2');
        DoceditPage.clickConfirmDuplicateInModal();

        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('resource1')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('resource2')), delays.ECWaitTime);
    });
});
