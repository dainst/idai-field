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

const EC = protractor.ExpectedConditions;
const delays = require('../config/delays');


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('resources --', () => {

    let i = 0;


    beforeAll(() => {

        ResourcesPage.get();
        browser.sleep(delays.shortRest * 3);
    });


    beforeEach(async () => {
        if (i > 0) {
            NavbarPage.performNavigateToSettings();
            require('request').post('http://localhost:3003/reset', {});
            browser.sleep(delays.shortRest);
            NavbarPage.clickNavigateToProject();
            browser.sleep(delays.shortRest * 4);
            NavbarPage.clickNavigateToExcavation();
        }
        i++;
    });


    function gotoImageTab() {

        NavbarPage.clickNavigateToImages();
        NavbarPage.clickNavigateToExcavation();
        ResourcesPage.openEditByDoubleClickResource('context1');
        DoceditPage.clickImagesTab();

    }


    function addTwoImages() {

        gotoImageTab();
        DoceditImageTabPage.clickInsertImage();
        ImagePickerModalPage.getCells().get(0).click();
        ImagePickerModalPage.getCells().get(1).click();
        ImagePickerModalPage.clickAddImages();
        DoceditPage.clickSaveDocument();
        browser.sleep(delays.shortSleep * 80);
    }


    it('basic operations: create a new object of first listed type ', () => {

        ResourcesPage.performCreateResource('12',undefined,undefined,undefined,undefined,false);
        expect(NavbarPage.getMessageText()).toContain('erfolgreich');
    });


    it('basic operations: should delete a resource', () => {

        ResourcesPage.performCreateResource('1');
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('1')), delays.ECWaitTime);
        ResourcesPage.clickSelectResource('1');
        DetailSidebarPage.performEditDocument();
        DoceditPage.clickDeleteDocument();
        DoceditPage.typeInIdentifierInConfirmDeletionInputField('1');
        DoceditPage.clickConfirmDeleteInModal();
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('1')), delays.ECWaitTime);
    });


    it('basic behaviour: should not reflect changes in overview in realtime', () => {

        ResourcesPage.performCreateResource('1a');
        ResourcesPage.clickSelectResource('1a');
        DetailSidebarPage.performEditDocument();
        DoceditPage.typeInInputField('identifier', '1b');
        ResourcesPage.getSelectedListItemIdentifierText().then(x=>{expect(x).toBe('1a')});
        DoceditPage.clickCloseEdit();
        ResourcesPage.clickDiscardInModal();
    });


    it('basic behaviour: hide the new resource button while creating a new resource', () => {

        ResourcesPage.clickCreateResource();
        ResourcesPage.clickSelectResourceType();
        ResourcesPage.clickSelectGeometryType('point');
        ResourcesPage.getListItemMarkedNewEls().then(els => expect(els.length).toBe(1));
        browser.wait(EC.stalenessOf(ResourcesPage.getCreateDocumentButton()), delays.ECWaitTime);
    });


    it('docedit modal: should save changes via dialog modal', () => {

        ResourcesPage.performCreateResource('1');
        ResourcesPage.clickSelectResource('1');
        DetailSidebarPage.performEditDocument();
        DoceditPage.typeInInputField('identifier', '2');
        DoceditPage.clickCloseEdit();
        ResourcesPage.clickSaveInModal();
        ResourcesPage.getSelectedListItemIdentifierText().then(x=>{expect(x).toBe('2')});
    });


    it('docedit modal: should discard changes via dialog modal', () => {

        ResourcesPage.performCreateResource('1');
        ResourcesPage.clickSelectResource('1');
        DetailSidebarPage.performEditDocument();
        DoceditPage.typeInInputField('identifier', '2');
        DoceditPage.clickCloseEdit();
        ResourcesPage.clickDiscardInModal();
        ResourcesPage.getSelectedListItemIdentifierText().then(x=>{expect(x).toBe('1')});
    });


    it('docedit modal: should cancel dialog modal', () => {

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


    it('main types: create a resource', () => {

        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('context1')), delays.ECWaitTime);
        ResourcesPage.performCreateMainTypeResource('newTrench');
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value).toContain('newTrench'));
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('context1')), delays.ECWaitTime);
        ResourcesPage.getListItemEls().then(elements => expect(elements.length).toBe(0));
    });


    it('main types: should refresh the resources list when switching main type documents', () => {

        ResourcesPage.performCreateMainTypeResource('newTrench');
        NavbarPage.clickNavigateToExcavation();

        ResourcesPage.getListItemEls().then(elements => expect(elements.length).toBe(0));
        ResourcesPage.performSelectOperation(1);
    });


    it('main types: edit a resource', () => {

        NavbarPage.clickNavigateToProject();
        ResourcesPage.openEditByDoubleClickResource('trench1');
        DoceditPage.typeInInputField('identifier', 'newIdentifier');
        DoceditPage.clickSaveDocument();
        browser.sleep(delays.shortRest);
        NavbarPage.clickNavigateToExcavation();
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value).toContain('newIdentifier'));
    });


    it('main types: delete a resource', () => {

        NavbarPage.clickNavigateToExcavation();
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value).toContain('trench1'));
        ResourcesPage.getListItemEls().then(elements => expect(elements.length).toBeGreaterThan(0));

        NavbarPage.clickNavigateToProject();
        ResourcesPage.openEditByDoubleClickResource('trench1');
        DoceditPage.clickDeleteDocument();
        DoceditPage.typeInIdentifierInConfirmDeletionInputField('trench1');
        DoceditPage.clickConfirmDeleteInModal();
        browser.sleep(delays.shortRest);
        NavbarPage.clickCloseAllMessages();

        ResourcesPage.openEditByDoubleClickResource('trench2');
        DoceditPage.clickDeleteDocument();
        DoceditPage.typeInIdentifierInConfirmDeletionInputField('trench2');
        DoceditPage.clickConfirmDeleteInModal();
        browser.sleep(delays.shortRest);
        NavbarPage.clickCloseAllMessages();
        NavbarPage.clickNavigateToExcavation();

        browser.sleep(delays.shortRest);
        browser.wait(EC.presenceOf(element(by.css('.no-main-type-resource-alert'))), delays.ECWaitTime);

        ResourcesPage.getListItemEls().then(elements => expect(elements.length).toBe(0));
    });


    it('type change: should change the type of a resource to a child type', () => {

        ResourcesPage.performCreateResource('1', 'feature');
        ResourcesPage.clickSelectResource('1');
        DetailSidebarPage.performEditDocument();
        DoceditPage.clickTypeSwitcherButton();
        DoceditPage.clickTypeSwitcherOption('feature-architecture');
        browser.wait(EC.stalenessOf(element(by.id('message-0'))), delays.ECWaitTime);
        DoceditPage.clickSaveDocument();
        DetailSidebarPage.getTypeFromDocView().then(typeLabel => expect(typeLabel).toEqual('Architektur'));
    });


    it('type change: should delete invalid fields when changing the type of a resource to its parent type', () => {

        ResourcesPage.performCreateResource('1', 'feature-architecture');
        ResourcesPage.clickSelectResource('1');
        DetailSidebarPage.performEditDocument();

        DoceditPage.clickSelectOption('hasWallType', 1);
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
        DetailSidebarPage.getTypeFromDocView().then(typeLabel => expect(typeLabel).toEqual('Stratigrafische Einheit'));
        browser.wait(EC.stalenessOf(FieldsViewPage.getFieldElement(0)));
    });


    it('type change: should delete invalid relations when changing the type of a resource to a sibling type', () => {

        ResourcesPage.performCreateResource('1', 'feature-architecture');
        ResourcesPage.performCreateResource('2', 'wall_surface');
        ResourcesPage.performCreateRelation('1', '2', 9);
        ResourcesPage.clickSelectResource('2');
        RelationsViewPage.getRelations().then(relations => expect(relations.length).toBe(1));
        RelationsViewPage.getRelationValue(0).then(relationValue => expect(relationValue).toEqual('1'));
        ResourcesPage.clickSelectResource('1');
        RelationsViewPage.getRelations().then(relations => expect(relations.length).toBe(1));
        RelationsViewPage.getRelationValue(0).then(relationValue => expect(relationValue).toEqual('2'));
        DetailSidebarPage.performEditDocument();
        DoceditPage.clickTypeSwitcherButton();
        DoceditPage.clickTypeSwitcherOption('feature-layer');
        NavbarPage.awaitAlert('Bitte beachten Sie, dass die Relationen der folgenden Relationstypen beim Speichern '
            + 'verloren gehen: Trägt');
        NavbarPage.clickCloseAllMessages();
        DoceditPage.clickSaveDocument();
        DetailSidebarPage.getTypeFromDocView().then(typeLabel => expect(typeLabel).toEqual('Erdbefund'));
        RelationsViewPage.getRelations().then(relations => expect(relations.length).toBe(0));
        ResourcesPage.clickSelectResource('2');
        RelationsViewPage.getRelations().then(relations => expect(relations.length).toBe(0));
    });


    /**
     * Addresses an issue where relations were shown double.
     */
    it('detail-sidebar: show only relations present in the object', () => {

        ResourcesPage.performCreateLink();
        ResourcesPage.clickSelectResource('1');
        RelationsViewPage.getRelations().then(function(relations) {
            expect(relations.length).toBe(1);
        });
    });


    it('detail-sidebar: show the relations present in the object', () => {

        ResourcesPage.performCreateLink();
        ResourcesPage.clickSelectResource('1');
        RelationsViewPage.getRelationName(0).then(value => {
            expect(value).toBe('Wird geschnitten von'); // with the correct relation label
        });
        RelationsViewPage.getRelationValue(0).then(value => {
            expect(value).toBe('2');
        });
    });


    it('detail-sidebar: show the fields present in the object', () => {

        ResourcesPage.performCreateResource('1', 'feature-architecture', 'hasArea', '100');
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
    it('detail-sidebar: show only the fields present in the object', () => {

        ResourcesPage.performCreateResource('1', 'feature-architecture', 'hasArea', '100');
        ResourcesPage.clickSelectResource('1');
        FieldsViewPage.getFields().then(function(items) {
            expect(items.length).toBe(1);
        });
    });


    it('messages: show the success msg also on route change', () => {

        ResourcesPage.performCreateResource('12',undefined,undefined,undefined,undefined,false);
        ResourcesPage.openEditByDoubleClickResource('12');
        DoceditPage.typeInInputField('identifier', '34');
        DoceditPage.clickCloseEdit();
        ResourcesPage.clickSaveInModal();

        expect(NavbarPage.getMessageText()).toContain('erfolgreich');
        NavbarPage.clickCloseAllMessages();
    });


    it('messages: warn if identifier is missing', () => {

        browser.sleep(5000);

        ResourcesPage.performCreateResource('', 'feature', 'shortDescription', 'Text', undefined, false);

        NavbarPage.awaitAlert('identifier', false);
        NavbarPage.clickCloseAllMessages();
        DoceditPage.clickCloseEdit();
        ResourcesPage.clickDiscardInModal();
    });


    it('messages: warn if an existing identifier is used', () => {

        ResourcesPage.performCreateResource('12',undefined,undefined,undefined,undefined,false);
        ResourcesPage.performCreateResource('12',undefined,undefined,undefined,undefined,false);

        NavbarPage.awaitAlert('existiert bereits', false);
        NavbarPage.clickCloseAllMessages();
        DoceditPage.clickCloseEdit();
        ResourcesPage.clickDiscardInModal();
    });


    it('messages: do not warn if two different identifiers start with the same string', () => {

        ResourcesPage.performCreateResource('120',undefined,undefined,undefined,undefined,false);
        ResourcesPage.performCreateResource('12',undefined,undefined,undefined,undefined,false);

        expect(NavbarPage.getMessageText()).toContain('erfolgreich');
    });


    it('relations: create a new relation and the corresponding inverse relation', () => {

        ResourcesPage.performCreateLink();
        ResourcesPage.openEditByDoubleClickResource('2');
        expect(DoceditRelationsTabPage.getRelationButtonText(1, 0, 0)).toEqual('1');
        DoceditPage.clickCloseEdit();
        ResourcesPage.clickSelectResource('1');
        DetailSidebarPage.performEditDocument();
        expect(DoceditRelationsTabPage.getRelationButtonText(2, 0, 0)).toEqual('2');
        DoceditPage.clickCloseEdit();

    });


    it('relations: edit a resource that contains a relation', () => {

        ResourcesPage.performCreateLink();
        ResourcesPage.openEditByDoubleClickResource('2');
        DoceditPage.clickFieldsTab();
        DoceditPage.typeInInputField('identifier', '123');
        DoceditPage.clickSaveDocument();
        // expectation?
    });


    it('relations: delete a relation and the corresponding inverse relation', () => {

        ResourcesPage.performCreateLink();
        ResourcesPage.clickSelectResource('1');
        RelationsViewPage.getRelations().then(relations => expect(relations.length).toBe(1));
        ResourcesPage.clickSelectResource('2');
        RelationsViewPage.getRelations().then(relations => expect(relations.length).toBe(1));
        DetailSidebarPage.performEditDocument();
        DoceditPage.clickRelationsTab();
        DoceditRelationsTabPage.clickRelationDeleteButtonByIndices(1, 0, 0);
        DoceditPage.clickSaveDocument();
        RelationsViewPage.getRelations().then(relations => expect(relations.length).toBe(0));
        ResourcesPage.clickSelectResource('1');
        RelationsViewPage.getRelations().then(relations => expect(relations.length).toBe(0));
    });


    it('relations: delete inverse relations when deleting a resource', () => {

        ResourcesPage.performCreateLink();
        ResourcesPage.openEditByDoubleClickResource('2');
        DoceditPage.clickDeleteDocument();
        DoceditPage.typeInIdentifierInConfirmDeletionInputField('2');
        DoceditPage.clickConfirmDeleteInModal();
        ResourcesPage.clickSelectResource('1');
        RelationsViewPage.getRelations().then(relations => expect(relations.length).toBe(0));
    });


    it('docedit modal images tab: create links for images', done => {

        addTwoImages();
        ThumbnailViewPage.getThumbs().then(thumbs => {
            expect(thumbs.length).toBe(2);
            done();
        });
    });


    it('docedit modal images tab: delete links to one image', done => {

        addTwoImages();
        gotoImageTab();
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


    it('docedit modal images tab: delete links to two images', done => {

        addTwoImages();
        gotoImageTab();
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


    it('list mode: show newly created resource in list view', () => {

        ResourcesPage.performCreateResourceInList('1', 'feature-architecture');
        ResourcesPage.getListModeInputFieldValue('1', 0).then(inputValue => expect(inputValue).toEqual('1'));
    });


    it('list mode: save changes on input field blur', () => {

        ResourcesPage.performCreateResourceInList('1', 'feature-architecture');
        ResourcesPage.performCreateResourceInList('2', 'feature-architecture');

        ResourcesPage.typeInListModeInputField('1', 1, 'Changed resource 1');
        ResourcesPage.getListModeInputField('2', 0).click();
    });


    it('list mode: navigate to child item view in list mode and create a new child object', () => {

        ResourcesPage.performCreateResourceInList('5', 'feature-architecture');
        ResourcesPage.clickMoveIntoButton('5');
        ResourcesPage.performCreateResourceInList('child1', 'find');
        NavbarPage.clickNavigateToProject();
        NavbarPage.clickNavigateToExcavation();

        ResourcesPage.getListModeInputFieldValue('child1', 0).then(inputValue => expect(inputValue).toEqual('child1'));
    });


    it('list mode: restore identifier from database if a duplicate identifier is typed in', () => {

        ResourcesPage.performCreateResourceInList('1', 'feature-architecture');
        ResourcesPage.performCreateResourceInList('2', 'feature-architecture');
        ResourcesPage.performCreateResourceInList('3', 'feature-architecture');

        ResourcesPage.typeInListModeInputField('2', 0, '1');
        ResourcesPage.getListModeInputField('3', 0).click();

        expect(NavbarPage.getMessageText()).toContain('existiert bereits');

        ResourcesPage.getListModeInputFieldValue('2', 0).then(inputValue => expect(inputValue).toEqual('2'));
        NavbarPage.clickCloseAllMessages();

    });


    /**
     * Addresses an issue where relations were still shown after cancelling edit and discarding changes
     * (they were not saved though).
     */
    it('show no relations after cancelling edit', () => {

        ResourcesPage.performCreateResource('1', 'feature-architecture');
        ResourcesPage.performCreateResource('2', 'feature-architecture');
        ResourcesPage.clickSelectResource('1');
        DetailSidebarPage.performEditDocument();
        DoceditPage.clickRelationsTab();
        DoceditRelationsTabPage.clickAddRelationForGroupWithIndex(1);
        DoceditRelationsTabPage.typeInRelationByIndices(1, 0, '2');
        DoceditRelationsTabPage.clickChooseRelationSuggestion(1, 0, 0);
        DoceditPage.clickCloseEdit();
        ResourcesPage.clickDiscardInModal();

        browser.wait(EC.visibilityOf(element(by.css('.detail-sidebar'))), delays.ECWaitTime);
        RelationsViewPage.getRelations().then(function(relations) {
            expect(relations.length).toBe(0);
        });
    });
});
