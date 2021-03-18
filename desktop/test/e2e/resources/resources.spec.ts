import {browser, protractor, element, by} from 'protractor';
import {DoceditPage} from '../docedit/docedit.page';
import {SearchBarPage} from '../widgets/search-bar.page';
import {ResourcesPage} from './resources.page';
import {NavbarPage} from '../navbar.page';
import {MenuPage} from '../menu.page';
import {DetailSidebarPage} from '../widgets/detail-sidebar.page';
import {FieldsViewPage} from '../widgets/fields-view.page';
import {DoceditRelationsTabPage} from '../docedit/docedit-relations-tab.page';
import {DoceditImageTabPage} from '../docedit/docedit-image-tab.page';
import {ImagePickerModalPage} from '../widgets/image-picker-modal.page';
import {MapPage} from '../map/map.page';
import {ImageViewPage} from '../images/image-view.page';
import {ImageRowPage} from '../images/image-row.page';

const EC = protractor.ExpectedConditions;
const delays = require('../delays');
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
 * change category
 * docedit/images
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('resources --', () => {

    beforeEach(() => {

        browser.sleep(1000);

        MenuPage.navigateToSettings();
        common.resetApp();
        NavbarPage.clickCloseNonResourcesTab();
        NavbarPage.clickTab('project');
        ResourcesPage.clickHierarchyButton('S1');
    });


    function addTwoImages(identifier) {

        ResourcesPage.openEditByDoubleClickResource(identifier);
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

        ResourcesPage.performCreateResource('12');

        browser.sleep(2500);

        // warn if identifier is missing
        ResourcesPage.performCreateResource('', 'feature', 'diary',
            'p', false, false, false);

        NavbarPage.awaitAlert('Bitte füllen Sie das Feld', false);
        NavbarPage.awaitAlert('Bezeichner', false);
        NavbarPage.clickCloseAllMessages();
        DoceditPage.clickCloseEdit('discard');
    });


    it('messages - same identifier', () => {

        ResourcesPage.performCreateResource('12',undefined,undefined,
            undefined,false, false,false);

        // do not warn if two different identifiers start with the same string
        ResourcesPage.performCreateResource('120',undefined,undefined,
            undefined,false, false,false);

        // same identifier
        ResourcesPage.performCreateResource('12',undefined,undefined,
            undefined,false, false,false);

        NavbarPage.awaitAlert('existiert bereits', false);
        NavbarPage.clickCloseAllMessages();
        DoceditPage.clickCloseEdit('discard');
    });


    it('creation/docedit/savedialog -- save changes via dialog modal', () => {

        ResourcesPage.performCreateResource('1');
        DetailSidebarPage.doubleClickEditDocument('1');
        DoceditPage.typeInInputField('identifier', '2');
        DoceditPage.clickCloseEdit('save');

        ResourcesPage.getSelectedListItemIdentifierText().then(identifier => expect(identifier).toBe('2'));
    });


    it('creation/docedit/savedialog -- discard changes via dialog modal', () => {

        ResourcesPage.performCreateResource('1');
        DetailSidebarPage.doubleClickEditDocument('1');
        DoceditPage.typeInInputField('identifier', '2');
        DoceditPage.clickCloseEdit('discard');

        ResourcesPage.getSelectedListItemIdentifierText().then(identifier => expect(identifier).toBe('1'));
    });


    it('creation/docedit/savedialog -- cancel dialog modal', () => {

        ResourcesPage.performCreateResource('1');
        DetailSidebarPage.doubleClickEditDocument('1');
        DoceditPage.typeInInputField('identifier', '2');
        DoceditPage.clickCloseEdit('cancel');
        expect<any>(DoceditPage.getInputFieldValue(0)).toEqual('2');
        DoceditPage.clickCloseEdit('discard');
    });


    it('create/edit/delete an operation and update navbar', () => {

        // edit
        NavbarPage.clickTab('project');
        NavbarPage.getTabLabel('resources', 't1').then(label => expect(label).toContain('S1'));

        ResourcesPage.openEditByDoubleClickResource('S1');
        DoceditPage.typeInInputField('identifier', 'newIdentifier');
        DoceditPage.clickSaveDocument();
        browser.sleep(delays.shortRest * 2);
        NavbarPage.getTabLabel('resources', 't1').then(label => expect(label).toContain('newIdentifier'));

        // delete
        ResourcesPage.clickOpenContextMenu('newIdentifier');
        ResourcesPage.clickContextMenuDeleteButton();
        ResourcesPage.typeInIdentifierInConfirmDeletionInputField('newIdentifier');
        ResourcesPage.clickConfirmDeleteInModal();
        browser.wait(EC.stalenessOf(NavbarPage.getTab('resources', 't1')), delays.ECWaitTime);

        // create
        ResourcesPage.performCreateOperation('newTrench');
        NavbarPage.getActiveNavLinkLabel().then(label => expect(label).toContain('newTrench'));
        ResourcesPage.getListItemEls().then(elements => expect(elements.length).toBe(0));
    });


    it('fields', () => { // formerly sidebar/info

        ResourcesPage.performCreateResource('1', 'feature-architecture',
            'diary', '100');
        ResourcesPage.clickSelectResource('1', 'info');
        FieldsViewPage.getFieldName(0, 1).then(value => {
            expect(value).toBe('Tagebuch'); // with the correct field label
        });
        FieldsViewPage.getFieldValue(0, 1).then(value => {
            expect(value).toBe('100');
        });

        // Make sure there are only so much as expected
        FieldsViewPage.getFields(1).then(items => {
            expect(items.length).toBe(2);
        });
    });


    it('relations', () => {

        ResourcesPage.performCreateLink();

        // sidebar
        ResourcesPage.clickSelectResource('1', 'info');
        FieldsViewPage.clickAccordionTab(1);

        FieldsViewPage.getRelationValue(1, 0).then(value => {
            expect(value).toBe('2');
        });
        FieldsViewPage.getRelationName(1, 0).then(value => {
            expect(value).toBe('Zeitlich nach');
        });
        // Make sure there are only so much as expected
        FieldsViewPage.getRelations(1).then(relations => expect(relations.length).toBe(1));

        ResourcesPage.clickSelectResource('2', 'info');
        FieldsViewPage.getRelationName(1, 0).then(value => expect(value).toBe('Zeitlich vor'));
        FieldsViewPage.getRelationValue(1, 0).then(value => expect(value).toBe('1'));

        // docedit
        ResourcesPage.openEditByDoubleClickResource('1');
        expect(DoceditRelationsTabPage.getRelationButtonText('zeitlich-nach')).toEqual('2');
        DoceditPage.clickCloseEdit();
        ResourcesPage.openEditByDoubleClickResource('2');
        expect(DoceditRelationsTabPage.getRelationButtonText('zeitlich-vor')).toEqual('1');

        // deletion
        DoceditRelationsTabPage.clickRelationDeleteButtonByIndices('zeitlich-vor');
        DoceditPage.clickSaveDocument();
        ResourcesPage.clickSelectResource('1', 'info');
        FieldsViewPage.getTabs().then(tabs => expect(tabs.length).toBe(1));
        ResourcesPage.clickSelectResource('2', 'info');
        FieldsViewPage.getTabs().then(tabs => expect(tabs.length).toBe(1));
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
        DoceditRelationsTabPage.clickAddRelationForGroupWithIndex('zeitgleich-mit');
        DoceditRelationsTabPage.typeInRelationByIndices('zeitgleich-mit', 0, '2');
        DoceditRelationsTabPage.clickChooseRelationSuggestion('zeitgleich-mit', 0, 0);
        DoceditPage.clickCloseEdit('discard');

        ResourcesPage.clickSelectResource('1', 'info');
        browser.wait(EC.visibilityOf(element(by.id('popover-menu'))), delays.ECWaitTime);
        FieldsViewPage.getTabs().then(tabs => expect(tabs.length).toBe(1)); // Only core
    });


    it('show only values of parent resource for campaign field in editor', () => {

        NavbarPage.clickTab('project');
        ResourcesPage.performCreateResource('trench', 'trench');
        ResourcesPage.clickHierarchyButton('trench');
        ResourcesPage.performCreateResource('feature', 'feature');
        ResourcesPage.openEditByDoubleClickResource('feature');
        DoceditPage.getCheckboxes('campaign')
            .then(checkboxes => expect(checkboxes.length).toBe(0));

        DoceditPage.clickCloseEdit();
        NavbarPage.clickTab('project');
        ResourcesPage.openEditByDoubleClickResource('trench');
        DoceditPage.getCheckboxes('campaign')
            .then(checkboxes => {
                expect(checkboxes.length).toBe(2);
                expect(checkboxes[0].getText()).toEqual('Testkampagne 1');
                expect(checkboxes[1].getText()).toEqual('Testkampagne 2');
            });

        DoceditPage.clickCheckbox('campaign', 0);
        DoceditPage.clickSaveDocument();
        ResourcesPage.clickHierarchyButton('trench');
        ResourcesPage.openEditByDoubleClickResource('feature');
        DoceditPage.getCheckboxes('campaign')
            .then(checkboxes => {
                expect(checkboxes.length).toBe(1);
                expect(checkboxes[0].getText()).toEqual('Testkampagne 1');
            });

        DoceditPage.clickCloseEdit();
    });


    it('show geometry edit widget for suitable categories', () => {

        ResourcesPage.performCreateResource('1', 'feature');
        ResourcesPage.openEditByDoubleClickResource('1');
        DoceditPage.clickGotoPositionTab();
        browser.wait(EC.presenceOf(DoceditPage.getGeometryEditWidget()), delays.ECWaitTime);
        DoceditPage.clickCloseEdit();
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
        ResourcesPage.clickSelectResource('1', 'info');
        // browser.wait(EC.visibilityOf(element(by.id('#relations-view'))), delays.ECWaitTime); // make sure relations view is really open
        FieldsViewPage.getTabs().then(tabs => expect(tabs.length).toBe(1)); // Only core
    });


    it('do not reflect changes in list while editing resource', () => {

        ResourcesPage.performCreateResource('1a');
        DetailSidebarPage.doubleClickEditDocument('1a');
        DoceditPage.typeInInputField('identifier', '1b');
        ResourcesPage.getSelectedListItemIdentifierText().then(identifier => {
            expect(identifier).toBe('1a');
        });
        DoceditPage.clickCloseEdit('discard');
    });


    it('change category', () => {

        // toggleRangeOnOff to child category
        ResourcesPage.performCreateResource('1', 'feature');
        DetailSidebarPage.doubleClickEditDocument('1');
        DoceditPage.clickCategorySwitcherButton();
        DoceditPage.clickCategorySwitcherOption('feature-architecture');
        browser.wait(EC.stalenessOf(element(by.id('message-0'))), delays.ECWaitTime);
        DoceditPage.clickSaveDocument();
        ResourcesPage.clickSelectResource('1', 'info');
        FieldsViewPage.getFieldValue(0, 0).then(categoryLabel => {
            expect(categoryLabel).toEqual('Architektur');
        });


        // delete invalid fields when changing the category of a resource to its parent category
        DetailSidebarPage.doubleClickEditDocument('1');

        DoceditPage.clickGotoChildTab();
        DoceditPage.clickSelectOption('wallType', 1);
        DoceditPage.clickSaveDocument();

        browser.sleep(delays.shortRest);
        // ResourcesPage.clickSelectResource('1', 'info');
        FieldsViewPage.clickAccordionTab(1);
        FieldsViewPage.getFieldValue(1, 0).then(fieldValue => {
            expect(fieldValue).toEqual('Außenmauer');
        });
        DetailSidebarPage.doubleClickEditDocument('1');
        DoceditPage.clickCategorySwitcherButton();
        DoceditPage.clickCategorySwitcherOption('feature');
        NavbarPage.awaitAlert('Bitte beachten Sie, dass die Daten der folgenden Felder beim Speichern ' +
            'verloren gehen: Mauertyp');
        NavbarPage.clickCloseAllMessages();
        DoceditPage.clickSaveDocument();

        FieldsViewPage.clickAccordionTab(0);
        FieldsViewPage.getFieldValue(0, 0).then(fieldValue => {
            expect(fieldValue).toEqual('Stratigraphische Einheit');
        });
        FieldsViewPage.getTabs().then(tabs => expect(tabs.length).toBe(1));
    });


    it('hide the new resource button while creating a new resource', () => {

        ResourcesPage.clickCreateResource();
        ResourcesPage.clickSelectCategory();
        ResourcesPage.clickSelectGeometryType('point');
        ResourcesPage.getListItemMarkedNewEls().then(els => expect(els.length).toBe(1));
        browser.wait(EC.stalenessOf(ResourcesPage.getCreateDocumentButton()), delays.ECWaitTime);
        MapPage.clickMapOption('abort');
        browser.wait(EC.presenceOf(ResourcesPage.getCreateDocumentButton()), delays.ECWaitTime);
    });


    it('remove new resource from list if docedit modal is canceled during resource creation', () => {

        ResourcesPage.clickCreateResource();
        ResourcesPage.clickSelectCategory();
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
        ResourcesPage.clickSelectCategory();
        ResourcesPage.clickSelectGeometryType();
        DoceditPage.typeInInputField('identifier', 'resource1');
        DoceditPage.clickDuplicateDocument();
        DoceditPage.typeInNumberOfDuplicates('2');
        DoceditPage.clickConfirmDuplicateInModal();

        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('resource1')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('resource2')), delays.ECWaitTime);
    });


    it('contextMenu/moveModal - move a resource with children to another operation', () => {

        ResourcesPage.clickOpenContextMenu('SE0');
        ResourcesPage.clickContextMenuMoveButton();
        ResourcesPage.typeInMoveModalSearchBarInput('S2');
        ResourcesPage.clickResourceListItemInMoveModal('S2');
        browser.wait(EC.stalenessOf(ResourcesPage.getMoveModal()), delays.ECWaitTime);

        NavbarPage.getActiveNavLinkLabel().then(label => expect(label).toContain('S2'));
        ResourcesPage.getListItemEls().then(elements => expect(elements.length).toBe(7));

        ResourcesPage.clickHierarchyButton('SE0');
        ResourcesPage.clickOpenChildCollectionButton();
        ResourcesPage.getListItemEls().then(elements => expect(elements.length).toBe(1));

        NavbarPage.clickTab('project');
        ResourcesPage.clickHierarchyButton('S1');
        ResourcesPage.getListItemEls().then(elements => expect(elements.length).toBe(0));
    });


    it('contextMenu/moveModal - move an operation to root level', () => {

        NavbarPage.clickTab('project');
        browser.sleep(delays.shortRest * 2);
        ResourcesPage.performCreateResource('P1', 'place');
        ResourcesPage.clickOpenContextMenu('S1');
        ResourcesPage.clickContextMenuMoveButton();
        ResourcesPage.typeInMoveModalSearchBarInput('P');
        ResourcesPage.getResourceIdentifierLabelsInMoveModal().then(labels => {
            for (let label of labels) expect(label.getText()).not.toEqual('Projekt');
        });
        ResourcesPage.typeInMoveModalSearchBarInput('P1');
        ResourcesPage.clickResourceListItemInMoveModal('P1');
        browser.wait(EC.stalenessOf(ResourcesPage.getMoveModal()), delays.ECWaitTime);
        ResourcesPage.getListItemEls().then(elements => expect(elements.length).toBe(1));

        ResourcesPage.clickOpenContextMenu('S1');
        ResourcesPage.clickContextMenuMoveButton();
        ResourcesPage.typeInMoveModalSearchBarInput('P');
        ResourcesPage.getResourceIdentifierLabelsInMoveModal().then(labels => {
            expect(labels[0].getText()).toEqual('Projekt');
        });
        ResourcesPage.clickResourceListItemInMoveModal('Projekt');
        browser.wait(EC.stalenessOf(ResourcesPage.getMoveModal()), delays.ECWaitTime);
        ResourcesPage.getListItemEls().then(elements => expect(elements.length).toBe(5));
    });


    it('contextMenu/moveModal - show only category filter options for allowed parent categories in move modal', () => {

        ResourcesPage.clickOpenContextMenu('SE0');
        ResourcesPage.clickContextMenuMoveButton();
        SearchBarPage.clickCategoryFilterButton('modal');
        SearchBarPage.getCategoryFilterOptionLabels().then(labels => {
            expect(labels.length).toBe(7);
            expect(labels[0].getText()).toEqual('Schnitt');
            expect(labels[1].getText()).toEqual('Stratigraphische Einheit');
        });
        SearchBarPage.clickCategoryFilterButton('modal');
        ResourcesPage.clickCancelInMoveModal();

        NavbarPage.clickTab('project');
        ResourcesPage.clickOpenContextMenu('S1');
        ResourcesPage.clickContextMenuMoveButton();
        SearchBarPage.clickCategoryFilterButton('modal');
        SearchBarPage.getCategoryFilterOptionLabels().then(labels => {
            expect(labels.length).toBe(1);
            expect(labels[0].getText()).toEqual('Ort');
        });
        SearchBarPage.clickCategoryFilterButton('modal');
        ResourcesPage.clickCancelInMoveModal();
    });


    it('contextMenu/moveModal - do not suggest current parent resource', () => {

        ResourcesPage.clickOpenContextMenu('SE0');
        ResourcesPage.clickContextMenuMoveButton();
        SearchBarPage.clickChooseCategoryFilter('trench', 'modal');
        ResourcesPage.getResourceIdentifierLabelsInMoveModal().then(labels => {
           for (let label of labels) expect(label.getText()).not.toEqual('S1');
        });
        ResourcesPage.clickCancelInMoveModal();

        ResourcesPage.performDescendHierarchy('SE0');

        ResourcesPage.clickOpenContextMenu('testf1');
        browser.sleep(delays.shortRest * 2);
        ResourcesPage.clickContextMenuMoveButton();
        SearchBarPage.clickChooseCategoryFilter('feature', 'modal');
        ResourcesPage.getResourceIdentifierLabelsInMoveModal().then(labels => {
            for (let label of labels) expect(label.getText()).not.toEqual('SE0');
        });
        ResourcesPage.clickCancelInMoveModal();
    });


    it('contextMenu/moveModal - do not suggest descendants of current resource', () => {

        ResourcesPage.performDescendHierarchy('SE0');
        ResourcesPage.performCreateResource('SE-D1', 'feature');
        ResourcesPage.performDescendHierarchy('SE-D1');
        ResourcesPage.performCreateResource('SE-D2', 'feature');

        ResourcesPage.clickOperationNavigationButton();
        ResourcesPage.clickOpenContextMenu('SE0');
        ResourcesPage.clickContextMenuMoveButton();
        SearchBarPage.clickChooseCategoryFilter('feature', 'modal');
        ResourcesPage.getResourceIdentifierLabelsInMoveModal().then(labels => {
            for (let label of labels) {
                expect(label.getText()).not.toEqual('SE-D1');
                expect(label.getText()).not.toEqual('SE-D2');
            }
        });
        ResourcesPage.clickCancelInMoveModal();
    });


    it('images', () => {

        // create links for images

        addTwoImages('SE0');
        ResourcesPage.clickSelectResource('SE0', 'info');
        ResourcesPage.clickThumbnail();
        ImageRowPage.getImages().then(images => expect(images.length).toBe(2));

        ImageViewPage.clickCloseButton();


        // delete links to one image

        ResourcesPage.openEditByDoubleClickResource('SE0');
        DoceditPage.clickGotoImagesTab();

        DoceditImageTabPage.waitForCells();
        DoceditImageTabPage.getCells().get(0).click();
        DoceditImageTabPage.clickDeleteImages();
        DoceditImageTabPage.getCells().then(cells => {
            expect(cells.length).toBe(1);
        });
        DoceditPage.clickSaveDocument();

        ResourcesPage.clickThumbnail();
        ImageRowPage.getImages().then(images => expect(images.length).toBe(1));

        ImageViewPage.clickCloseButton();


        // delete links to the other

        browser.wait(EC.presenceOf(ResourcesPage.getThumbnail()), delays.ECWaitTime);

        ResourcesPage.openEditByDoubleClickResource('SE0');
        DoceditPage.clickGotoImagesTab();
        DoceditImageTabPage.waitForCells();
        DoceditImageTabPage.getCells().get(0).click();
        DoceditImageTabPage.clickDeleteImages();
        DoceditImageTabPage.getCells().then(cells => expect(cells.length).toBe(0));
        DoceditPage.clickSaveDocument();

        browser.wait(EC.stalenessOf(ResourcesPage.getThumbnail()), delays.ECWaitTime);
    });
});
