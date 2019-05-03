import {browser, protractor, element, by} from 'protractor';
import {DoceditPage} from '../docedit/docedit.page';
import {SearchBarPage} from '../widgets/search-bar.page';
import {ResourcesPage} from './resources.page';
import {NavbarPage} from '../navbar.page';
import {MenuPage} from '../menu.page';
import {DetailSidebarPage} from '../widgets/detail-sidebar.page';
import {FieldsViewPage} from '../widgets/fields-view.page';
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
 * creation
 *   creation with relations
 *   messages
 *     after docedit closed, under various conditions
 * deletion
 *   including relations
 * operations
 *   creation, deletion, editing
 *   update of navbar
 * relations
 *   creation
 *   showing in sidebar
 *   showing in docedit afterwards
 * move
 *   contextMenu/moveModal
 * typechange
 * sidebar/info
 * docedit/images
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('resources --', () => {

    let i = 0;


    beforeAll(() => {

        ResourcesPage.get();
        browser.sleep(delays.shortRest * 4);
        ResourcesPage.performJumpToTrenchView('S1');
    });


    beforeEach(async done => {

        if (i > 0) {
            MenuPage.navigateToSettings();
            await common.resetApp();
            browser.sleep(delays.shortRest);
            NavbarPage.clickCloseNonResourcesTab();
            NavbarPage.clickTab('project');
            browser.sleep(delays.shortRest * 3);
            ResourcesPage.performJumpToTrenchView('S1');
        }

        i++;
        done();
    });


    function gotoImageTab() {

        MenuPage.navigateToImages();
        NavbarPage.clickCloseNonResourcesTab();
        NavbarPage.clickTab('project');

        ResourcesPage.performJumpToTrenchView('S1');
        ResourcesPage.openEditByDoubleClickResource('SE0');
        // DoceditPage.clickImagesTab(); TODO remove
        DoceditPage.clickGotoImagesTab();
    }


    function addTwoImages() {

        // gotoImageTab();
        ResourcesPage.openEditByDoubleClickResource('SE0');
        DoceditPage.clickGotoImagesTab();
        DoceditImageTabPage.clickInsertImage();

        DoceditImageTabPage.waitForCells();
        ImagePickerModalPage.getCells().get(0).click();
        ImagePickerModalPage.getCells().get(1).click();
        ImagePickerModalPage.clickAddImages();
        DoceditPage.clickSaveDocument();
        browser.sleep(delays.shortSleep * 80);
    }



    it('messages - everything fine / missing identifier', () => {

        ResourcesPage.performCreateResource('12',undefined,undefined,undefined,undefined,false);
        expect(NavbarPage.getMessageText()).toContain('erfolgreich');

        browser.sleep(2500);

        // warn if identifier is missing
        ResourcesPage.performCreateResource('', 'feature',
            'processor', 'p', undefined,
            false, false);

        NavbarPage.awaitAlert('Bitte füllen Sie das Feld', false);
        NavbarPage.awaitAlert('Bezeichner', false);
        NavbarPage.clickCloseAllMessages();
        DoceditPage.clickCloseEdit();
        ResourcesPage.clickDiscardInModal();
    });


    it('messages - same identifier', () => {

        ResourcesPage.performCreateResource('12',undefined,undefined,
            undefined,undefined,false);

        // do not warn if two different identifiers start with the same string
        ResourcesPage.performCreateResource('120',undefined,undefined,
            undefined,undefined,false);
        expect(NavbarPage.getMessageText()).toContain('erfolgreich');
        NavbarPage.clickCloseAllMessages();

        // same identifier
        ResourcesPage.performCreateResource('12',undefined,undefined,
            undefined,undefined,false, false);

        NavbarPage.awaitAlert('existiert bereits', false);
        NavbarPage.clickCloseAllMessages();
        DoceditPage.clickCloseEdit();
        ResourcesPage.clickDiscardInModal();
    });


    it('creation/docedit/savedialog -- save changes via dialog modal', () => {

        ResourcesPage.performCreateResource('1');
        DetailSidebarPage.doubleClickEditDocument('1');
        DoceditPage.typeInInputField('identifier', '2');
        DoceditPage.clickCloseEdit();
        ResourcesPage.clickSaveInModal();

        ResourcesPage.getSelectedListItemIdentifierText().then(identifier => expect(identifier).toBe('2'));
    });


    it('creation/docedit/savedialog -- discard changes via dialog modal', () => {

        ResourcesPage.performCreateResource('1');
        DetailSidebarPage.doubleClickEditDocument('1');
        DoceditPage.typeInInputField('identifier', '2');
        DoceditPage.clickCloseEdit();
        ResourcesPage.clickDiscardInModal();

        ResourcesPage.getSelectedListItemIdentifierText().then(identifier => expect(identifier).toBe('1'));
    });


    it('creation/docedit/savedialog -- cancel dialog modal', () => {

        ResourcesPage.performCreateResource('1');
        DetailSidebarPage.doubleClickEditDocument('1');
        DoceditPage.typeInInputField('identifier', '2');
        DoceditPage.clickCloseEdit();
        ResourcesPage.clickCancelInModal();
        expect<any>(DoceditPage.getInputFieldValue(0)).toEqual('2');
        DoceditPage.clickCloseEdit();
        ResourcesPage.clickDiscardInModal();
    });


    it('create/edit/delete an operation and update navbar', () => {

        // edit
        NavbarPage.clickTab('project');
        NavbarPage.getTabLabel('resources', 't1').then(label => expect(label).toEqual('S1'));

        ResourcesPage.openEditByDoubleClickResource('S1');
        DoceditPage.typeInInputField('identifier', 'newIdentifier');
        DoceditPage.clickSaveDocument();
        browser.sleep(delays.shortRest * 2);
        NavbarPage.getTabLabel('resources', 't1').then(label => expect(label).toEqual('newIdentifier'));

        // delete
        ResourcesPage.clickOpenContextMenu('newIdentifier');
        ResourcesPage.clickContextMenuDeleteButton();
        ResourcesPage.typeInIdentifierInConfirmDeletionInputField('newIdentifier');
        ResourcesPage.clickConfirmDeleteInModal();
        browser.sleep(delays.shortRest);
        NavbarPage.clickCloseAllMessages();

        browser.wait(EC.stalenessOf(NavbarPage.getTab('resources', 't1')), delays.ECWaitTime);

        // create
        ResourcesPage.performCreateOperation('newTrench');
        NavbarPage.getActiveNavLinkLabel().then(label => expect(label).toEqual('newTrench'));
        ResourcesPage.getListItemEls().then(elements => expect(elements.length).toBe(0));
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


    it('find a resource by its identifier', () => { // TODO move to another test suite

        ResourcesPage.performCreateResource('1');
        SearchBarPage.typeInSearchField('1');
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('1')), delays.ECWaitTime);
    });


    it('sidebar/info -- show the fields present in the object', () => {

        ResourcesPage.performCreateResource('1', 'feature-architecture',
            'processor', '100');
        ResourcesPage.clickSelectResource('1', 'info');
        FieldsViewPage.getFieldName(0, 2).then(value => {
            expect(value).toBe('Bearbeiterin/Bearbeiter'); // with the correct field label
        });
        FieldsViewPage.getFieldValue(0, 2).then(value => {
            expect(value).toBe('100');
        });

        // Make sure there are only so much as expected
        FieldsViewPage.getFields(1).then(items => {
            expect(items.length).toBe(3);
        });
    });


    it('relations', () => {

        ResourcesPage.performCreateLink();

        // sidebar
        ResourcesPage.clickSelectResource('1', 'links');
        RelationsViewPage.getRelationName(0).then(value => {
            expect(value).toBe('Zeitlich nach');
        });
        RelationsViewPage.getRelationValue(0).then(value => {
            expect(value).toBe('2');
        });
        // Make sure there are only so much as expected
        RelationsViewPage.getRelations().then(relations => {
            expect(relations.length).toBe(1);
        });

        ResourcesPage.clickSelectResource('2', 'links');
        RelationsViewPage.getRelationName(0).then(value => {
            expect(value).toBe('Zeitlich vor');
        });
        RelationsViewPage.getRelationValue(0).then(value => {
            expect(value).toBe('1');
        });

        // docedit
        ResourcesPage.openEditByDoubleClickResource('1');
        expect(DoceditRelationsTabPage.getRelationButtonText(2)).toEqual('2'); // TODO make available via name of the relation as first parameter
        DoceditPage.clickCloseEdit();
        ResourcesPage.openEditByDoubleClickResource('2');
        expect(DoceditRelationsTabPage.getRelationButtonText(1)).toEqual('1'); // TODO make available via name of the relation as first parameter

        // deletion
        DoceditRelationsTabPage.clickRelationDeleteButtonByIndices(1);
        DoceditPage.clickSaveDocument();
        ResourcesPage.clickSelectResource('1', 'links');
        RelationsViewPage.getRelations().then(relations => expect(relations.length).toBe(0));
        ResourcesPage.clickSelectResource('2', 'links');
        RelationsViewPage.getRelations().then(relations => expect(relations.length).toBe(0));
    });


    /**
     * Addresses an issue where relations were still shown after cancelling edit and discarding changes
     * (they were not saved though).
     */
    it('relations -- do not show new relations after cancelling edit', () => {

        ResourcesPage.performCreateResource('1', 'feature-architecture');
        ResourcesPage.performCreateResource('2', 'feature-architecture');
        DetailSidebarPage.doubleClickEditDocument('1');
        DoceditPage.clickGotoTimeTab();
        DoceditRelationsTabPage.clickAddRelationForGroupWithIndex(0);
        DoceditRelationsTabPage.typeInRelationByIndices(0, 0, '2');
        DoceditRelationsTabPage.clickChooseRelationSuggestion(0, 0, 0);
        DoceditPage.clickCloseEdit();
        ResourcesPage.clickDiscardInModal();

        ResourcesPage.clickSelectResource('1', 'links');
        // browser.wait(EC.visibilityOf(element(by.css('.detail-sidebar'))), delays.ECWaitTime);
        RelationsViewPage.getRelations().then(relations => {
            expect(relations.length).toBe(0);
        });
    });


    it('deletion', () => {

        ResourcesPage.performCreateLink();
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('2')), delays.ECWaitTime);
        ResourcesPage.clickOpenContextMenu('2');
        ResourcesPage.clickContextMenuDeleteButton();
        ResourcesPage.typeInIdentifierInConfirmDeletionInputField('2');
        ResourcesPage.clickConfirmDeleteInModal();
        browser.sleep(delays.shortRest);
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('2')), delays.ECWaitTime);

        // relations
        ResourcesPage.clickSelectResource('1', 'links');
        // browser.wait(EC.visibilityOf(element(by.id('#relations-view'))), delays.ECWaitTime); // make sure relations view is really open TODO put it into clickSelectResource after tab gets opened
        RelationsViewPage.getRelations().then(relations => expect(relations.length).toBe(0));
    });


    it('do not reflect changes in list while editing resource', () => {

        ResourcesPage.performCreateResource('1a');
        DetailSidebarPage.doubleClickEditDocument('1a');
        DoceditPage.typeInInputField('identifier', '1b');
        ResourcesPage.getSelectedListItemIdentifierText().then(identifier => {
            expect(identifier).toBe('1a');
        });
        DoceditPage.clickCloseEdit();
        ResourcesPage.clickDiscardInModal();
    });


    it('typechange', () => {

        // change to child type
        ResourcesPage.performCreateResource('1', 'feature');
        DetailSidebarPage.doubleClickEditDocument('1');
        DoceditPage.clickTypeSwitcherButton();
        DoceditPage.clickTypeSwitcherOption('feature-architecture');
        browser.wait(EC.stalenessOf(element(by.id('message-0'))), delays.ECWaitTime);
        DoceditPage.clickSaveDocument();
        ResourcesPage.clickSelectResource('1', 'info');
        FieldsViewPage.getFieldValue(0, 1).then(typeLabel => expect(typeLabel).toEqual('Architektur'));


        // delete invalid fields when changing the type of a resource to its parent type
        DetailSidebarPage.doubleClickEditDocument('1');

        DoceditPage.clickGotoChildPropertiesTab();
        DoceditPage.clickSelectOption('wallType', 1);
        DoceditPage.clickSaveDocument();

        browser.sleep(delays.shortRest);
        // ResourcesPage.clickSelectResource('1', 'info');
        FieldsViewPage.clickAccordionTab(1);
        FieldsViewPage.getFieldValue(1, 0).then(fieldValue => expect(fieldValue).toEqual('Außenmauer'));
        DetailSidebarPage.doubleClickEditDocument('1');
        DoceditPage.clickTypeSwitcherButton();
        DoceditPage.clickTypeSwitcherOption('feature');
        NavbarPage.awaitAlert('Bitte beachten Sie, dass die Daten der folgenden Felder beim Speichern verloren ' +
            'gehen: Mauertyp');
        NavbarPage.clickCloseAllMessages();
        DoceditPage.clickSaveDocument();

        FieldsViewPage.clickAccordionTab(0);
        FieldsViewPage.getFieldValue(0, 1).then(fieldValue => expect(fieldValue).toEqual('Stratigraphische Einheit'));
        FieldsViewPage.getTabs().then(tabs => expect(tabs.length).toBe(1));
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


    it('contextMenu/moveModal - move a resource', () => {

        browser.sleep(delays.shortRest * 2);
        ResourcesPage.clickOpenContextMenu('SE0');
        ResourcesPage.clickContextMenuMoveButton();
        ResourcesPage.typeInMoveModalSearchBarInput('S2');
        ResourcesPage.clickResourceListItemInMoveModal('S2');
        browser.wait(EC.stalenessOf(ResourcesPage.getMoveModal()), delays.ECWaitTime);

        NavbarPage.getActiveNavLinkLabel().then(label => expect(label).toEqual('S2'));
        ResourcesPage.getListItemEls().then(elements => expect(elements.length).toBe(7));

        NavbarPage.clickTab('project');
        ResourcesPage.performJumpToTrenchView('S1');
        ResourcesPage.getListItemEls().then(elements => expect(elements.length).toBe(0));
    });


    it('contextMenu/moveModal - show only type filter options for allowed parent types in move modal', () => {

        browser.sleep(delays.shortRest * 2);
        ResourcesPage.clickOpenContextMenu('SE0');
        ResourcesPage.clickContextMenuMoveButton();
        SearchBarPage.clickTypeFilterButton('modal');
        SearchBarPage.getTypeFilterOptionLabels().then(labels => {
            expect(labels.length).toBe(8);
            expect(labels[0].getText()).toEqual('Schnitt');
            expect(labels[1].getText()).toEqual('Stratigraphische Einheit');
        });
        SearchBarPage.clickTypeFilterButton('modal');
        ResourcesPage.clickCancelInMoveModal();

        NavbarPage.clickTab('project');
        ResourcesPage.clickOpenContextMenu('S1');
        ResourcesPage.clickContextMenuMoveButton();
        SearchBarPage.clickTypeFilterButton('modal');
        SearchBarPage.getTypeFilterOptionLabels().then(labels => {
            expect(labels.length).toBe(1);
            expect(labels[0].getText()).toEqual('Ort');
        });
        SearchBarPage.clickTypeFilterButton('modal');
        ResourcesPage.clickCancelInMoveModal();
    });


    xit('contextMenu/moveModal - do not suggest current parent resource', () => {

        browser.sleep(delays.shortRest * 2);
        ResourcesPage.clickOpenContextMenu('SE0');
        ResourcesPage.clickContextMenuMoveButton();
        SearchBarPage.clickChooseTypeFilter('trench', 'modal');
        ResourcesPage.getResourceIdentifierLabelsInMoveModal().then(labels => {
           for (let label of labels) expect(label.getText()).not.toEqual('S1');
        });
        ResourcesPage.clickCancelInMoveModal();

        ResourcesPage.clickHierarchyButton('SE0');
        ResourcesPage.clickOpenContextMenu('testf1');
        ResourcesPage.clickContextMenuMoveButton();
        SearchBarPage.clickChooseTypeFilter('feature', 'modal');
        ResourcesPage.getResourceIdentifierLabelsInMoveModal().then(labels => {
            for (let label of labels) expect(label.getText()).not.toEqual('SE0');
        });
        ResourcesPage.clickCancelInMoveModal();
    });


    xit('contextMenu/moveModal - do not suggest descendants of current resource', () => {

        ResourcesPage.clickHierarchyButton('SE0');
        ResourcesPage.performCreateResource('SE-D1', 'feature');
        ResourcesPage.clickHierarchyButton('SE-D1');
        ResourcesPage.performCreateResource('SE-D2', 'feature');

        ResourcesPage.clickOperationNavigationButton();
        ResourcesPage.clickOpenContextMenu('SE0');
        ResourcesPage.clickContextMenuMoveButton();
        SearchBarPage.clickChooseTypeFilter('feature', 'modal');
        ResourcesPage.getResourceIdentifierLabelsInMoveModal().then(labels => {
            for (let label of labels) {
                expect(label.getText()).not.toEqual('SE-D1');
                expect(label.getText()).not.toEqual('SE-D2');
            }
        });
        ResourcesPage.clickCancelInMoveModal();
    });


    it('do not open context menu for new resources while creating geometry', () => {

        ResourcesPage.clickCreateResource();
        ResourcesPage.clickSelectResourceType();
        ResourcesPage.clickSelectGeometryType('point');
        ResourcesPage.clickOpenContextMenu('SE0');
        browser.wait(EC.presenceOf(ResourcesPage.getContextMenu()), delays.ECWaitTime);
        ResourcesPage.clickOpenContextMenu('undefined');
        browser.wait(EC.stalenessOf(ResourcesPage.getContextMenu()), delays.ECWaitTime);
        MapPage.clickMapOption('abort');
    });


    xit('docedit/images -- create links for images', done => {

        addTwoImages();
        ThumbnailViewPage.getThumbs().then(thumbs => {
            expect(thumbs.length).toBe(2);
            done();
        });
    });


    xit('docedit/images -- delete links to one image', done => {

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


    xit('docedit/images -- delete links to two images', done => {

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

});
