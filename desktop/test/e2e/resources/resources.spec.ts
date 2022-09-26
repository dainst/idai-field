import { click, getText, navigateTo, pause, resetApp, start, stop, waitForNotExist, waitForExist } from '../app';
import { DoceditPage} from '../docedit/docedit.page';
import { SearchBarPage } from '../widgets/search-bar.page';
import { ResourcesPage } from './resources.page';
import { NavbarPage } from '../navbar.page';
import { DetailSidebarPage } from '../widgets/detail-sidebar.page';
import { FieldsViewPage } from '../widgets/fields-view.page';
import { DoceditRelationsPage } from '../docedit/docedit-relations.page';
import { ImagePickerModalPage } from '../widgets/image-picker-modal.page';
import { MapPage } from '../map/map.page';
import { ImageViewPage } from '../images/image-view.page';
import { ImageRowPage } from '../images/image-row.page';
import { ImageViewModalPage } from '../image-view-modal.page';
import { ConfigurationPage } from '../configuration/configuration.page';


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

    beforeAll(async done => {

        await start();
        done();
    });


    beforeEach(async done => {

        await navigateTo('settings');
        await resetApp();
        await NavbarPage.clickCloseNonResourcesTab();
        await NavbarPage.clickTab('project');
        await ResourcesPage.clickHierarchyButton('S1');

        done();
    });


    afterAll(async done => {

        await stop();
        done();
    });


    async function addTwoImages(identifier) {

        await ResourcesPage.clickOpenContextMenu(identifier);
        await ResourcesPage.clickContextMenuImagesButton();
        await ImageViewModalPage.clickPlusButton();
        await ImageViewModalPage.clickLinkImagesButton();

        await ImageViewModalPage.waitForCells();
        await click((await ImagePickerModalPage.getCells())[0]);
        await click((await ImagePickerModalPage.getCells())[1]);
        await ImagePickerModalPage.clickAddImages();
        await ImageViewModalPage.clickCloseButton();
    }


    it('messages - everything fine / missing identifier', async done => {

        await ResourcesPage.performCreateResource('12');

        // warn if identifier is missing
        await ResourcesPage.performCreateResource('', 'feature', 'diary', 'p', false, false, false);

        await NavbarPage.awaitAlert('Bitte füllen Sie das Feld', false);
        await NavbarPage.awaitAlert('Bezeichner', false);
        await NavbarPage.clickCloseAllMessages();
        await DoceditPage.clickCloseEdit('discard');

        done();
    });


    it('messages - same identifier', async done => {

        await ResourcesPage.performCreateResource('12', undefined, undefined, undefined, false, false, false);

        await pause(1000);

        // do not warn if two different identifiers start with the same string
        await ResourcesPage.performCreateResource('120', undefined, undefined, undefined, false, false, false);

        await pause(1000);

        // same identifier
        await ResourcesPage.performCreateResource('12', undefined, undefined, undefined, false, false, false);

        await NavbarPage.awaitAlert('existiert bereits', false);
        await NavbarPage.clickCloseAllMessages();
        await DoceditPage.clickCloseEdit('discard');

        done();
    });


    it('creation/docedit/savedialog -- save changes via dialog modal', async done => {

        await ResourcesPage.performCreateResource('1');
        await DetailSidebarPage.doubleClickEditDocument('1');
        await DoceditPage.typeInInputField('identifier', '2');
        await DoceditPage.clickCloseEdit('save');

        const identifier = await ResourcesPage.getSelectedListItemIdentifierText();
        expect(identifier).toBe('2');

        done();
    });


    it('creation/docedit/savedialog -- discard changes via dialog modal', async done => {

        await ResourcesPage.performCreateResource('1');
        await DetailSidebarPage.doubleClickEditDocument('1');
        await DoceditPage.typeInInputField('identifier', '2');
        await DoceditPage.clickCloseEdit('discard');

        const identifier = await ResourcesPage.getSelectedListItemIdentifierText();
        expect(identifier).toBe('1');

        done();
    });


    it('creation/docedit/savedialog -- cancel dialog modal', async done => {

        await ResourcesPage.performCreateResource('1');
        await DetailSidebarPage.doubleClickEditDocument('1');
        await DoceditPage.typeInInputField('identifier', '2');
        await DoceditPage.clickCloseEdit('cancel');
        await expect(await DoceditPage.getSimpleInputFieldValue(0)).toEqual('2');
        await DoceditPage.clickCloseEdit('discard');

        done();
    });


    it('create/edit/delete an operation and update navbar', async done => {

        // edit
        await NavbarPage.clickTab('project');
        let label = await NavbarPage.getTabLabel('resources', 't1');
        expect(label).toContain('S1');

        await ResourcesPage.openEditByDoubleClickResource('S1');
        await DoceditPage.typeInInputField('identifier', 'newIdentifier');
        await DoceditPage.clickSaveDocument();
        label = await NavbarPage.getTabLabel('resources', 't1');
        expect(label).toContain('newIdentifier');

        // delete
        await ResourcesPage.clickOpenContextMenu('newIdentifier');
        await ResourcesPage.clickContextMenuDeleteButton();
        await ResourcesPage.typeInIdentifierInConfirmDeletionInputField('newIdentifier');
        await ResourcesPage.clickConfirmDeleteInModal();
        await waitForNotExist(await NavbarPage.getTab('resources', 't1'));

        // create
        await ResourcesPage.performCreateTrench('newTrench');
        label = await NavbarPage.getActiveNavLinkLabel();
        expect(label).toContain('newTrench');
        const elements = await ResourcesPage.getListItemEls();
        expect(elements.length).toBe(0);

        done();
    });


    it('fields', async done => {

        await ResourcesPage.performCreateResource('1', 'feature-architecture', 'diary', '100');
        await ResourcesPage.clickSelectResource('1', 'info');

        const fieldName = await FieldsViewPage.getFieldName(0, 1);
        expect(fieldName).toBe('Tagebuch');
        const fieldValue = await FieldsViewPage.getFieldValue(0, 1);
        expect(fieldValue).toBe('100');
        const items = await FieldsViewPage.getFields(1);
        expect(items.length).toBe(2);

        done();
    });


    it('relations', async done => {

        await ResourcesPage.performCreateLink();
        await ResourcesPage.clickSelectResource('1', 'info');
        await FieldsViewPage.clickAccordionTab(1);

        let relationValue = await FieldsViewPage.getRelationValue(1, 0);
        expect(relationValue).toBe('2');
        let relationName = await FieldsViewPage.getRelationName(1, 0);
        expect(relationName).toBe('Zeitlich nach');
        const relations = await FieldsViewPage.getRelations(1);
        expect(relations.length).toBe(1);

        await ResourcesPage.clickSelectResource('2', 'info');
        relationValue = await FieldsViewPage.getRelationValue(1, 0);
        expect(relationValue).toBe('1');
        relationName = await FieldsViewPage.getRelationName(1, 0);
        expect(relationName).toBe('Zeitlich vor');

        // docedit
        await ResourcesPage.openEditByDoubleClickResource('1');
        expect(await DoceditRelationsPage.getRelationButtonText('isAfter')).toEqual('2');
        await DoceditPage.clickCloseEdit();
        await ResourcesPage.openEditByDoubleClickResource('2');
        expect(await DoceditRelationsPage.getRelationButtonText('isBefore')).toEqual('1');

        // deletion
        await DoceditRelationsPage.clickRelationDeleteButtonByIndices('isBefore');
        await DoceditPage.clickSaveDocument();
        await ResourcesPage.clickSelectResource('1', 'info');
        let tabs = await FieldsViewPage.getTabs();
        expect(tabs.length).toBe(1);
        await ResourcesPage.clickSelectResource('2', 'info');
        tabs = await FieldsViewPage.getTabs();
        expect(tabs.length).toBe(1);

        done();
    });


    /**
     * Addresses an issue where relations were still shown after cancelling edit and discarding changes
     * (they were not saved though).
     */
    it('relations -- do not show new relations after cancelling edit', async done => {

        await ResourcesPage.performCreateResource('1', 'feature-architecture');
        await ResourcesPage.performCreateResource('2', 'feature-architecture');
        await DetailSidebarPage.doubleClickEditDocument('1');
        await DoceditPage.clickGotoTimeTab();
        await DoceditRelationsPage.clickAddRelationForGroupWithIndex('isContemporaryWith');
        await DoceditRelationsPage.typeInRelation('isContemporaryWith', '2');
        await DoceditRelationsPage.clickChooseRelationSuggestion(0);
        await DoceditPage.clickCloseEdit('discard');

        await ResourcesPage.clickSelectResource('1', 'info');
        await waitForExist('#popover-menu');
        const tabs = await FieldsViewPage.getTabs();
        expect(tabs.length).toBe(1); // Only core

        done();
    });


    it('show only values of parent resource for campaign field in editor', async done => {

        await NavbarPage.clickTab('project');
        await ResourcesPage.performCreateResource('trench', 'operation-trench');
        await ResourcesPage.clickHierarchyButton('trench');
        await ResourcesPage.performCreateResource('feature', 'feature');
        await ResourcesPage.openEditByDoubleClickResource('feature');
        let checkboxes = await DoceditPage.getCheckboxes('campaign');
        expect(checkboxes.length).toBe(0);

        await DoceditPage.clickCloseEdit();
        await NavbarPage.clickTab('project');
        await ResourcesPage.openEditByDoubleClickResource('trench');
        checkboxes = await DoceditPage.getCheckboxes('campaign');
        expect(checkboxes.length).toBe(2);
        expect(await getText(checkboxes[0])).toEqual('Testkampagne 1');
        expect(await getText(checkboxes[1])).toEqual('Testkampagne 2');

        await DoceditPage.clickCheckbox('campaign', 0);
        await DoceditPage.clickSaveDocument();
        await ResourcesPage.clickHierarchyButton('trench');
        await ResourcesPage.openEditByDoubleClickResource('feature');
        checkboxes = await DoceditPage.getCheckboxes('campaign');
        expect(checkboxes.length).toBe(1);
        expect(await getText(checkboxes[0])).toEqual('Testkampagne 1');

        await DoceditPage.clickCloseEdit();

        done();
    });


    it('edit i18n field values', async done => {

        await ResourcesPage.clickCreateResource();
        await ResourcesPage.clickSelectCategory();
        await ResourcesPage.clickSelectGeometryType();
        await DoceditPage.typeInInputField('identifier', '1');
        await DoceditPage.clickLanguageTab('shortDescription', 'en');
        await DoceditPage.typeInInputField('shortDescription', 'English text');
        await DoceditPage.clickSaveDocument();
        expect(await ResourcesPage.getSelectedListItemShortDescriptionText()).toEqual('English text');

        await ResourcesPage.openEditByDoubleClickResource('1');
        await DoceditPage.clickLanguageTab('shortDescription', 'de');
        await DoceditPage.typeInInputField('shortDescription', 'Deutscher Text');
        await DoceditPage.clickSaveDocument();
        expect(await ResourcesPage.getSelectedListItemShortDescriptionText()).toEqual('Deutscher Text');

        done();
    });


    it('show string value in unspecifiedLanguage tab after changing input type from simpleInput to input', async done => {

        await navigateTo('configuration');
        await ConfigurationPage.changeMultiLanguageSetting('shortDescription', 'Feature');
        await ConfigurationPage.save();

        await NavbarPage.clickCloseNonResourcesTab();
        await ResourcesPage.clickCreateResource();
        await ResourcesPage.clickSelectCategory();
        await ResourcesPage.clickSelectGeometryType();
        let languageTabs = await DoceditPage.getLanguageTabs('shortDescription');
        expect(languageTabs.length).toBe(0);

        await DoceditPage.typeInInputField('identifier', '1');
        await DoceditPage.typeInInputField('shortDescription', 'Simple string text');
        await DoceditPage.clickSaveDocument();
        expect(await ResourcesPage.getSelectedListItemShortDescriptionText()).toEqual('Simple string text');
        
        await navigateTo('configuration');
        await ConfigurationPage.changeMultiLanguageSetting('shortDescription', 'Feature');
        await ConfigurationPage.save();

        await NavbarPage.clickCloseNonResourcesTab();
        await ResourcesPage.openEditByDoubleClickResource('1');
        languageTabs = await DoceditPage.getLanguageTabs('shortDescription');
        expect(languageTabs.length).toBe(4);
        expect(await getText(languageTabs[0])).toEqual('Ohne Sprachangabe');
        expect(await getText(languageTabs[1])).toEqual('Deutsch');
        expect(await getText(languageTabs[2])).toEqual('Englisch');
        expect(await getText(languageTabs[3])).toEqual('Italienisch');
        
        await DoceditPage.removeTextFromInputField('shortDescription');
        await DoceditPage.clickLanguageTab('shortDescription', 'de');
        await DoceditPage.typeInInputField('shortDescription', 'Deutscher Text');
        await DoceditPage.clickSaveDocument();
        expect(await ResourcesPage.getSelectedListItemShortDescriptionText()).toEqual('Deutscher Text');

        await ResourcesPage.openEditByDoubleClickResource('1');
        languageTabs = await DoceditPage.getLanguageTabs('shortDescription');
        expect(languageTabs.length).toBe(3);
        expect(await getText(languageTabs[0])).toEqual('Deutsch');
        expect(await getText(languageTabs[1])).toEqual('Englisch');
        expect(await getText(languageTabs[2])).toEqual('Italienisch');
        await DoceditPage.clickCloseEdit();

        done();
    });


    it('show geometry edit widget for suitable categories', async done => {

        await ResourcesPage.performCreateResource('1', 'feature');
        await ResourcesPage.openEditByDoubleClickResource('1');
        await DoceditPage.clickGotoPositionTab();
        await waitForExist(await DoceditPage.getGeometryEditWidget());
        await DoceditPage.clickCloseEdit();

        done();
    });


    it('deletion', async done => {

        await ResourcesPage.performCreateLink();
        await waitForExist(await ResourcesPage.getListItemEl('2'));
        await ResourcesPage.clickOpenContextMenu('2');
        await ResourcesPage.clickContextMenuDeleteButton();
        await ResourcesPage.typeInIdentifierInConfirmDeletionInputField('2');
        await ResourcesPage.clickConfirmDeleteInModal();
        await waitForNotExist(await ResourcesPage.getListItemEl('2'));

        // relations
        await ResourcesPage.clickSelectResource('1', 'info');
        const tabs = await FieldsViewPage.getTabs();
        expect(tabs.length).toBe(1); // Only core

        done();
    });


    it('do not reflect changes in list while editing resource', async done => {

        await ResourcesPage.performCreateResource('1a');
        await DetailSidebarPage.doubleClickEditDocument('1a');
        await DoceditPage.typeInInputField('identifier', '1b');
        const identifier = await ResourcesPage.getSelectedListItemIdentifierText();
        expect(identifier).toBe('1a');
        await DoceditPage.clickCloseEdit('discard');

        done();
    });


    it('change category', async done => {

        // toggleRangeOnOff to child category
        await ResourcesPage.performCreateResource('1', 'feature');
        await DetailSidebarPage.doubleClickEditDocument('1');
        await DoceditPage.clickCategorySwitcherButton();
        await DoceditPage.clickCategorySwitcherOption('feature-architecture');
        await waitForNotExist('#message-0');
        await DoceditPage.clickSaveDocument();
        await ResourcesPage.clickSelectResource('1', 'info');
        const categoryLabel = await FieldsViewPage.getFieldValue(0, 0);
        expect(categoryLabel).toEqual('Architektur');

        // delete invalid fields when changing the category of a resource to its parent category
        await DetailSidebarPage.doubleClickEditDocument('1');

        await DoceditPage.clickGotoPropertiesTab();
        await DoceditPage.clickSelectOption('wallType', 'Außenmauer');
        await DoceditPage.clickSaveDocument();

        FieldsViewPage.clickAccordionTab(1);
        let fieldValue = await FieldsViewPage.getFieldValue(1, 0);
        expect(fieldValue).toEqual('Außenmauer');

        await DetailSidebarPage.doubleClickEditDocument('1');
        await DoceditPage.clickCategorySwitcherButton();
        await DoceditPage.clickCategorySwitcherOption('feature');
        await NavbarPage.awaitAlert('Bitte beachten Sie, dass die Daten der folgenden Felder beim Speichern ' +
            'verloren gehen: Mauertyp');
        await NavbarPage.clickCloseAllMessages();
        await DoceditPage.clickSaveDocument();

        fieldValue = await FieldsViewPage.getFieldValue(0, 0);
        expect(fieldValue).toEqual('Stratigraphische Einheit');
        const tabs = await FieldsViewPage.getTabs();
        expect(tabs.length).toBe(1);

        done();
    });


    it('hide the new resource button while creating a new resource', async done => {

        await ResourcesPage.clickCreateResource();
        await ResourcesPage.clickSelectCategory();
        await ResourcesPage.clickSelectGeometryType('point');
        const elements = await ResourcesPage.getListItemMarkedNewEls();
        expect(elements.length).toBe(1);
        await waitForNotExist(await ResourcesPage.getCreateDocumentButton());
        await MapPage.clickMapOption('abort');
        await waitForExist(await ResourcesPage.getCreateDocumentButton());

        done();
    });


    it('remove new resource from list if docedit modal is canceled during resource creation', async done => {

        await ResourcesPage.clickCreateResource();
        await ResourcesPage.clickSelectCategory();
        await ResourcesPage.clickSelectGeometryType('point');
        let elements = await ResourcesPage.getListItemMarkedNewEls();
        expect(elements.length).toBe(1);

        await MapPage.clickMapOption('ok');
        await DoceditPage.clickCloseEdit();
        elements = await ResourcesPage.getListItemMarkedNewEls();
        expect(elements.length).toBe(0);

        done();
    });


    it('duplicate a resource', async done => {

        await ResourcesPage.performCreateResource('resource1', 'feature');
        await ResourcesPage.openEditByDoubleClickResource('resource1');
        await DoceditPage.clickDuplicateDocument();
        await DoceditPage.typeInNumberOfDuplicates('2');
        await DoceditPage.clickConfirmDuplicateInModal();

        await waitForExist(await ResourcesPage.getListItemEl('resource1'));
        await waitForExist(await ResourcesPage.getListItemEl('resource2'));
        await waitForExist(await ResourcesPage.getListItemEl('resource3'));

        done();
    });


    it('create two instances of a new resource', async done => {

        await ResourcesPage.clickCreateResource();
        await ResourcesPage.clickSelectCategory();
        await ResourcesPage.clickSelectGeometryType();
        await DoceditPage.typeInInputField('identifier', 'resource1');
        await DoceditPage.clickDuplicateDocument();
        await DoceditPage.typeInNumberOfDuplicates('2');
        await DoceditPage.clickConfirmDuplicateInModal();

        await waitForExist(await ResourcesPage.getListItemEl('resource1'));
        await waitForExist(await ResourcesPage.getListItemEl('resource2'));

        done();
    });


    it('contextMenu/moveModal - move a resource with children to another operation', async done => {

        await ResourcesPage.clickOpenContextMenu('SE0');
        await ResourcesPage.clickContextMenuMoveButton();
        await ResourcesPage.typeInMoveModalSearchBarInput('S2');
        await pause(2000);
        await ResourcesPage.clickResourceListItemInMoveModal('S2');
        await waitForNotExist(await ResourcesPage.getMoveModal());

        await pause(2000);
        const label = await NavbarPage.getActiveNavLinkLabel();
        expect(label).toContain('S2');
        await pause(2000);
        let elements = await ResourcesPage.getListItemEls();
        expect(elements.length).toBe(7);
        await pause(2000);

        await ResourcesPage.clickHierarchyButton('SE0');
        await ResourcesPage.clickOpenChildCollectionButton();
        elements = await ResourcesPage.getListItemEls();
        expect(elements.length).toBe(1);

        await NavbarPage.clickTab('project');
        await ResourcesPage.clickHierarchyButton('S1');
        elements = await ResourcesPage.getListItemEls();
        expect(elements.length).toBe(0);

        done();
    });


    it('contextMenu/moveModal - move an operation to root level', async done => {

        await NavbarPage.clickTab('project');
        await ResourcesPage.performCreateResource('P1', 'place');
        await ResourcesPage.clickOpenContextMenu('S1');
        await ResourcesPage.clickContextMenuMoveButton();
        await ResourcesPage.typeInMoveModalSearchBarInput('P');

        let labels = await ResourcesPage.getResourceIdentifierLabelsInMoveModal();
        for (let label of labels) {
            expect(await getText(label)).not.toEqual('Projekt');
        }

        await ResourcesPage.typeInMoveModalSearchBarInput('P1');
        await ResourcesPage.clickResourceListItemInMoveModal('P1');
        await waitForNotExist(await ResourcesPage.getMoveModal());
        let elements = await ResourcesPage.getListItemEls();
        expect(elements.length).toBe(1);

        await ResourcesPage.clickOpenContextMenu('S1');
        await ResourcesPage.clickContextMenuMoveButton();
        await ResourcesPage.typeInMoveModalSearchBarInput('P');
        labels = await ResourcesPage.getResourceIdentifierLabelsInMoveModal();
        expect(await getText(labels[0])).toEqual('Projekt');

        await ResourcesPage.clickResourceListItemInMoveModal('Projekt');
        await waitForNotExist(await ResourcesPage.getMoveModal());
        elements = await ResourcesPage.getListItemEls();
        expect(elements.length).toBe(5);

        done();
    });


    it('contextMenu/moveModal - show only category filter options for allowed parent categories in move modal', async done => {

        await ResourcesPage.clickOpenContextMenu('SE0');
        await ResourcesPage.clickContextMenuMoveButton();
        await SearchBarPage.clickCategoryFilterButton('modal');

        let labels = await SearchBarPage.getCategoryFilterOptionLabels();
        expect(labels.length).toBe(7);
        expect(await getText(labels[0])).toEqual('Schnitt');
        expect(await getText(labels[1])).toEqual('Stratigraphische Einheit');

        await SearchBarPage.clickCategoryFilterButton('modal');
        await ResourcesPage.clickCancelInMoveModal();

        await NavbarPage.clickTab('project');
        await ResourcesPage.clickOpenContextMenu('S1');
        await ResourcesPage.clickContextMenuMoveButton();
        await SearchBarPage.clickCategoryFilterButton('modal');
        labels = await SearchBarPage.getCategoryFilterOptionLabels();
        expect(labels.length).toBe(1);
        expect(await getText(labels[0])).toEqual('Ort');

        await SearchBarPage.clickCategoryFilterButton('modal');
        await ResourcesPage.clickCancelInMoveModal();

        await ResourcesPage.clickHierarchyButton('B1');
        await ResourcesPage.clickHierarchyButton('R1');
        await ResourcesPage.clickOpenChildCollectionButton();
        await ResourcesPage.performCreateResource('Floor1', 'roomfloor');
        await ResourcesPage.clickOpenContextMenu('Floor1');
        await ResourcesPage.clickContextMenuMoveButton();
        await SearchBarPage.clickCategoryFilterButton('modal');
        
        labels = await SearchBarPage.getCategoryFilterOptionLabels();
        expect(labels.length).toBe(1);
        expect(await getText(labels[0])).toEqual('Raum');

        await SearchBarPage.clickCategoryFilterButton('modal');
        await ResourcesPage.clickCancelInMoveModal();

        done();
    });


    it('contextMenu/moveModal - do not suggest current parent resource', async done => {

        await ResourcesPage.clickOpenContextMenu('SE0');
        await ResourcesPage.clickContextMenuMoveButton();
        await SearchBarPage.clickChooseCategoryFilter('operation-trench', 'modal');

        let labels = await ResourcesPage.getResourceIdentifierLabelsInMoveModal();
        for (let label of labels) {
            expect(await getText(label)).not.toEqual('S1');
        }

        await ResourcesPage.clickCancelInMoveModal();
        await ResourcesPage.performDescendHierarchy('SE0');
        await ResourcesPage.clickOpenContextMenu('testf1');
        await ResourcesPage.clickContextMenuMoveButton();
        await SearchBarPage.clickChooseCategoryFilter('feature', 'modal');

        labels = await ResourcesPage.getResourceIdentifierLabelsInMoveModal();
        for (let label of labels) {
            expect(await getText(label)).not.toEqual('SE0');
        }

        await ResourcesPage.clickCancelInMoveModal();

        done();
    });


    it('contextMenu/moveModal - do not suggest descendants of current resource', async done => {

        await ResourcesPage.performDescendHierarchy('SE0');
        await ResourcesPage.performCreateResource('SE-D1', 'feature');
        await ResourcesPage.performDescendHierarchy('SE-D1');
        await ResourcesPage.performCreateResource('SE-D2', 'feature');

        await ResourcesPage.clickOperationNavigationButton();
        await ResourcesPage.clickOpenContextMenu('SE0');
        await ResourcesPage.clickContextMenuMoveButton();
        await SearchBarPage.clickChooseCategoryFilter('feature', 'modal');

        const labels = await ResourcesPage.getResourceIdentifierLabelsInMoveModal();
        for (let label of labels) {
            expect(await getText(label)).not.toEqual('SE-D1');
            expect(await getText(label)).not.toEqual('SE-D2');
        }

        await ResourcesPage.clickCancelInMoveModal();

        done();
    });


    it('contextMenu/moveModal - prevent moving child resources to an unallowed operation', async done => {

        await NavbarPage.clickTab('project');
        await ResourcesPage.clickHierarchyButton('B1');
        await ResourcesPage.performCreateResource('BW1', 'buildingpart');
        await ResourcesPage.clickHierarchyButton('BW1');
        await ResourcesPage.clickOpenChildCollectionButton();
        await ResourcesPage.performCreateResource('R2', 'room');

        await ResourcesPage.clickOperationNavigationButton();
        await ResourcesPage.clickOpenContextMenu('BW1');
        await ResourcesPage.clickContextMenuMoveButton();
        await SearchBarPage.clickChooseCategoryFilter('operation-survey', 'modal');
        await ResourcesPage.clickResourceListItemInMoveModal('A1');
        await waitForNotExist(await ResourcesPage.getMoveModal());

        await NavbarPage.awaitAlert('kann nicht verschoben werden', false);

        done();
    });


    it('images', async done => {

        // create links for images
        await addTwoImages('SE0');
        await ResourcesPage.clickSelectResource('SE0', 'info');
        await ResourcesPage.clickThumbnail();
        let images = await ImageRowPage.getImages();
        expect(images.length).toBe(2);

        await ImageViewPage.clickCloseButton();

        // delete links to one image
        await ResourcesPage.clickOpenContextMenu('SE0');
        await ResourcesPage.clickContextMenuImagesButton();

        await ImageViewModalPage.waitForCells();
        await click((await ImageViewModalPage.getCells())[0]);
        await ImageViewModalPage.clickDeleteImages();
        await pause(1000);
        let cells = await ImageViewModalPage.getCells();
        expect(cells.length).toBe(1);
        ImageViewModalPage.clickCloseButton();

        await ResourcesPage.clickThumbnail();
        images = await ImageRowPage.getImages();
        expect(images.length).toBe(1);

        await ImageViewModalPage.clickCloseButton();

        // delete links to the other
        await waitForExist(await ResourcesPage.getThumbnail());

        await ResourcesPage.clickOpenContextMenu('SE0');
        await ResourcesPage.clickContextMenuImagesButton();
        await ImageViewModalPage.waitForCells();
        await click((await ImageViewModalPage.getCells())[0]);
        await ImageViewModalPage.clickDeleteImages();
        await pause(1000);
        cells = await ImageViewModalPage.getCells();
        expect(cells.length).toBe(0);

        await ImageViewModalPage.clickCloseButton();

        await waitForNotExist(await ResourcesPage.getThumbnail());

        done();
    });
});
