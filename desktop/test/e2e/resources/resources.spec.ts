import { click, getText, navigateTo, pause, resetApp, start, stop, waitForNotExist, waitForExist } from '../app';
import { DoceditPage} from '../docedit/docedit.page';
import { SearchBarPage } from '../widgets/search-bar.page';
import { ResourcesPage } from './resources.page';
import { NavbarPage } from '../navbar.page';
import { FieldsViewPage } from '../widgets/fields-view.page';
import { DoceditRelationsPage } from '../docedit/docedit-relations.page';
import { ImagePickerModalPage } from '../widgets/image-picker-modal.page';
import { MapPage } from '../map/map.page';
import { ImageViewPage } from '../images/image-view.page';
import { ImageRowPage } from '../images/image-row.page';
import { ImageViewModalPage } from '../image-view-modal.page';
import { ConfigurationPage } from '../configuration/configuration.page';
import { ProjectLanguagesModalPage } from '../configuration/project-languages-modal.page';
import { MoveModalPage } from '../widgets/move-modal.page';

const { test, expect } = require('@playwright/test');


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
test.describe('resources --', () => {

    test.beforeAll(async () => {

        await start();
    });


    test.beforeEach(async () => {

        await navigateTo('settings');
        await resetApp();
        await NavbarPage.clickCloseNonResourcesTab();
        await NavbarPage.clickTab('project');
        await ResourcesPage.clickHierarchyButton('S1');
    });


    test.afterAll(async () => {

        await stop();
    });


    async function addTwoImages(identifier) {

        await ResourcesPage.clickOpenContextMenu(identifier);
        await ResourcesPage.clickContextMenuImagesButton();
        await ImageViewModalPage.clickPlusButton();
        await ImageViewModalPage.clickLinkImagesButton();

        await ImageViewModalPage.waitForCells();
        await click((await ImagePickerModalPage.getCells()).nth(0));
        await click((await ImagePickerModalPage.getCells()).nth(1));
        await ImagePickerModalPage.clickAddImages();
        await ImageViewModalPage.clickCloseButton();
    }


    test('messages - everything fine / missing identifier', async () => {

        await ResourcesPage.performCreateResource('12');

        // warn if identifier is missing
        await ResourcesPage.performCreateResource('', 'feature', 'diary', 'p', false, false, false);

        await NavbarPage.awaitAlert('Bitte füllen Sie das Feld', false);
        await NavbarPage.awaitAlert('Bezeichner', false);
        await NavbarPage.clickCloseAllMessages();
        await DoceditPage.clickCloseEdit('discard');
    });


    test('messages - same identifier', async () => {

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
    });


    test('creation/docedit/savedialog -- save changes via dialog modal', async () => {

        await ResourcesPage.performCreateResource('1');
        await ResourcesPage.openEditByDoubleClickResource('1');
        await DoceditPage.typeInInputField('identifier', '2');
        await DoceditPage.clickCloseEdit('save');

        const identifier = await ResourcesPage.getSelectedListItemIdentifierText();
        expect(identifier).toBe('2');
    });


    test('creation/docedit/savedialog -- discard changes via dialog modal', async () => {

        await ResourcesPage.performCreateResource('1');
        await ResourcesPage.openEditByDoubleClickResource('1');
        await DoceditPage.typeInInputField('identifier', '2');
        await DoceditPage.clickCloseEdit('discard');

        expect(await ResourcesPage.getSelectedListItemIdentifierText()).toBe('1');
    });


    test('creation/docedit/savedialog -- cancel dialog modal', async () => {

        await ResourcesPage.performCreateResource('1');
        await ResourcesPage.openEditByDoubleClickResource('1');
        await DoceditPage.typeInInputField('identifier', '2');
        await DoceditPage.clickCloseEdit('cancel');
        await expect(await DoceditPage.getIdentifierInputFieldValue()).toEqual('2');
        await DoceditPage.clickCloseEdit('discard');
    });


    test('create/edit/delete an operation and update navbar', async () => {

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
        expect(await elements.count()).toBe(0);
    });


    test('fields', async () => {

        await ResourcesPage.performCreateResource('1', 'feature-architecture', 'diary', '100');
        await ResourcesPage.clickSelectResource('1');

        const fieldName = await FieldsViewPage.getFieldName(0, 1);
        expect(fieldName).toBe('Tagebuch');
        const fieldValue = await FieldsViewPage.getFieldValue(0, 1);
        expect(fieldValue).toBe('100');
        const items = await FieldsViewPage.getFields(1);
        expect(await items.count()).toBe(2);
    });


    test('relations', async () => {

        await ResourcesPage.performCreateLink();
        await ResourcesPage.clickSelectResource('1');
        await FieldsViewPage.clickAccordionTab(1);

        let relationValue = await FieldsViewPage.getRelationValue(1, 0);
        expect(relationValue).toBe('2');
        let relationName = await FieldsViewPage.getRelationName(1, 0);
        expect(relationName).toBe('Zeitlich nach');
        const relations = await FieldsViewPage.getRelations(1);
        expect(await relations.count()).toBe(1);

        await ResourcesPage.clickSelectResource('2');
        relationValue = await FieldsViewPage.getRelationValue(1, 0);
        expect(relationValue).toBe('1');
        relationName = await FieldsViewPage.getRelationName(1, 0);
        expect(relationName).toBe('Zeitlich vor');

        // docedit
        await ResourcesPage.openEditByDoubleClickResource('1');
        expect(await DoceditRelationsPage.getRelationButtonIdentifier('isAfter')).toEqual('2');
        await DoceditPage.clickCloseEdit();
        await ResourcesPage.openEditByDoubleClickResource('2');
        expect(await DoceditRelationsPage.getRelationButtonIdentifier('isBefore')).toEqual('1');

        // deletion
        await DoceditRelationsPage.clickRelationDeleteButtonByIndices('isBefore');
        await DoceditPage.clickSaveDocument();
        await ResourcesPage.clickSelectResource('1');
        let tabs = await FieldsViewPage.getTabs();
        expect(await tabs.count()).toBe(1);
        await ResourcesPage.clickSelectResource('2');
        tabs = await FieldsViewPage.getTabs();
        expect(await tabs.count()).toBe(1);
    });


    /**
     * Addresses an issue where relations were still shown after cancelling edit and discarding changes
     * (they were not saved though).
     */
    test('relations -- do not show new relations after cancelling edit', async () => {

        await ResourcesPage.performCreateResource('1', 'feature-architecture');
        await ResourcesPage.performCreateResource('2', 'feature-architecture');
        await ResourcesPage.openEditByDoubleClickResource('1');
        await DoceditPage.clickGotoTimeTab();
        await DoceditRelationsPage.clickAddRelationForGroupWithIndex('isContemporaryWith');
        await DoceditRelationsPage.typeInRelation('isContemporaryWith', '2');
        await DoceditRelationsPage.clickChooseRelationSuggestion(0);
        await DoceditPage.clickCloseEdit('discard');

        await ResourcesPage.clickSelectResource('1');
        await waitForExist('#popover-menu');
        const tabs = await FieldsViewPage.getTabs();
        expect(await tabs.count()).toBe(1); // Only core
    });


    test('show only values of parent resource for campaign field in editor', async () => {

        await NavbarPage.clickTab('project');
        await ResourcesPage.performCreateResource('trench', 'operation-trench');
        await ResourcesPage.clickHierarchyButton('trench');
        await ResourcesPage.performCreateResource('feature', 'feature');
        await ResourcesPage.openEditByDoubleClickResource('feature');
        let checkboxes = await DoceditPage.getCheckboxes('campaign');
        expect(await checkboxes.count()).toBe(0);

        await DoceditPage.clickCloseEdit();
        await NavbarPage.clickTab('project');
        await ResourcesPage.openEditByDoubleClickResource('trench');
        checkboxes = await DoceditPage.getCheckboxes('campaign');
        expect(await checkboxes.count()).toBe(2);
        expect(await getText(checkboxes.nth(0))).toEqual('Testkampagne 1');
        expect(await getText(checkboxes.nth(1))).toEqual('Testkampagne 2');

        await DoceditPage.clickCheckbox('campaign', 0);
        await DoceditPage.clickSaveDocument();
        await ResourcesPage.clickHierarchyButton('trench');
        await ResourcesPage.openEditByDoubleClickResource('feature');
        checkboxes = await DoceditPage.getCheckboxes('campaign');
        expect(await checkboxes.count()).toBe(1);
        expect(await getText(checkboxes.nth(0))).toEqual('Testkampagne 1');

        await DoceditPage.clickCloseEdit();
    });


    test('edit i18n field values', async () => {

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
    });


    test('show string value in unspecifiedLanguage tab after changing input type from simpleInput to input', async () => {

        await navigateTo('configuration');
        await waitForExist(await ConfigurationPage.getConfigurationEditor());
        await navigateTo('projectLanguages');
        await ProjectLanguagesModalPage.clickDeleteLanguage('it');
        await ProjectLanguagesModalPage.clickConfirm();
        await ConfigurationPage.changeMultiLanguageSetting('shortDescription', 'Feature');
        await ConfigurationPage.save();

        await NavbarPage.clickCloseNonResourcesTab();
        await ResourcesPage.clickCreateResource();
        await ResourcesPage.clickSelectCategory();
        await ResourcesPage.clickSelectGeometryType();
        let languageTabs = await DoceditPage.getLanguageTabs('shortDescription');
        expect(await languageTabs.count()).toBe(0);

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
        expect(await languageTabs.count()).toBe(5);
        expect(await getText(languageTabs.nth(0))).toEqual('Ohne Sprachangabe');
        expect(await getText(languageTabs.nth(1))).toEqual('Deutsch');
        expect(await getText(languageTabs.nth(2))).toEqual('Englisch');
        expect(await getText(languageTabs.nth(3))).toEqual('Türkisch');
        expect(await getText(languageTabs.nth(4))).toEqual('Ukrainisch');
        
        await DoceditPage.removeTextFromInputField('shortDescription');
        await DoceditPage.clickLanguageTab('shortDescription', 'de');
        await DoceditPage.typeInInputField('shortDescription', 'Deutscher Text');
        await DoceditPage.clickSaveDocument();
        expect(await ResourcesPage.getSelectedListItemShortDescriptionText()).toEqual('Deutscher Text');

        await ResourcesPage.openEditByDoubleClickResource('1');
        languageTabs = await DoceditPage.getLanguageTabs('shortDescription');
        expect(await languageTabs.count()).toBe(4);
        expect(await getText(languageTabs.nth(0))).toEqual('Deutsch');
        expect(await getText(languageTabs.nth(1))).toEqual('Englisch');
        expect(await getText(languageTabs.nth(2))).toEqual('Türkisch');
        expect(await getText(languageTabs.nth(3))).toEqual('Ukrainisch');
        await DoceditPage.clickCloseEdit();
    });


    test('show geometry edit widget for suitable categories', async () => {

        await ResourcesPage.performCreateResource('1', 'feature');
        await ResourcesPage.openEditByDoubleClickResource('1');
        await DoceditPage.clickGotoPositionTab();
        await waitForExist(await DoceditPage.getGeometryEditWidget());
        await DoceditPage.clickCloseEdit();
    });


    test('deletion', async () => {

        await ResourcesPage.performCreateLink();
        await waitForExist(await ResourcesPage.getListItemEl('2'));
        await ResourcesPage.clickOpenContextMenu('2');
        await ResourcesPage.clickContextMenuDeleteButton();
        await ResourcesPage.typeInIdentifierInConfirmDeletionInputField('2');
        await ResourcesPage.clickConfirmDeleteInModal();
        await waitForNotExist(await ResourcesPage.getListItemEl('2'));

        // relations
        await ResourcesPage.clickSelectResource('1');
        const tabs = await FieldsViewPage.getTabs();
        expect(await tabs.count()).toBe(1); // Only core
    });


    test('do not reflect changes in list while editing resource', async () => {

        await ResourcesPage.performCreateResource('1a');
        await ResourcesPage.openEditByDoubleClickResource('1a');
        await DoceditPage.typeInInputField('identifier', '1b');
        const identifier = await ResourcesPage.getSelectedListItemIdentifierText();
        expect(identifier).toBe('1a');
        await DoceditPage.clickCloseEdit('discard');
    });


    test('change category', async () => {

        // toggleRangeOnOff to child category
        await ResourcesPage.performCreateResource('1', 'feature');
        await ResourcesPage.openEditByDoubleClickResource('1');
        await DoceditPage.clickCategorySwitcherButton();
        await DoceditPage.clickCategorySwitcherOption('feature-architecture');
        await waitForNotExist('#message-0');
        await DoceditPage.clickSaveDocument();
        await ResourcesPage.clickSelectResource('1');
        const categoryLabel = await FieldsViewPage.getFieldValue(0, 0);
        expect(categoryLabel).toEqual('Architektur');

        // delete invalid fields when changing the category of a resource to its parent category
        await ResourcesPage.openEditByDoubleClickResource('1');

        await DoceditPage.clickGotoPropertiesTab();
        await DoceditPage.clickSelectOption('wallType', 'Außenmauer');
        await DoceditPage.clickSaveDocument();

        await FieldsViewPage.clickAccordionTab(1);
        expect(await FieldsViewPage.getFieldValue(1, 0)).toEqual('Außenmauer');

        await ResourcesPage.openEditByDoubleClickResource('1');
        await DoceditPage.clickCategorySwitcherButton();
        await DoceditPage.clickCategorySwitcherOption('feature');
        await NavbarPage.awaitAlert('Bitte beachten Sie, dass die Daten der folgenden Felder beim Speichern ' +
            'verloren gehen: Mauertyp');
        await NavbarPage.clickCloseAllMessages();
        await DoceditPage.clickSaveDocument();

        expect(await FieldsViewPage.getFieldValue(0, 0)).toEqual('Stratigraphische Einheit');
        const tabs = await FieldsViewPage.getTabs();
        expect(await tabs.count()).toBe(1);
    });


    test('hide the new resource button while creating a new resource', async () => {

        await ResourcesPage.clickCreateResource();
        await ResourcesPage.clickSelectCategory();
        await ResourcesPage.clickSelectGeometryType('point');
        const elements = await ResourcesPage.getListItemMarkedNewEls();
        expect(await elements.count()).toBe(1);
        await waitForNotExist(await ResourcesPage.getCreateDocumentButton());
        await MapPage.clickMapOption('abort');
        await waitForExist(await ResourcesPage.getCreateDocumentButton());
    });


    test('remove new resource from list if docedit modal is canceled during resource creation', async () => {

        await ResourcesPage.clickCreateResource();
        await ResourcesPage.clickSelectCategory();
        await ResourcesPage.clickSelectGeometryType('point');
        let elements = await ResourcesPage.getListItemMarkedNewEls();
        expect(await elements.count()).toBe(1);

        await MapPage.clickMapOption('ok');
        await DoceditPage.clickCloseEdit();
        elements = await ResourcesPage.getListItemMarkedNewEls();
        expect(await elements.count()).toBe(0);
    });


    test('duplicate a resource', async () => {

        await ResourcesPage.performCreateResource('resource1', 'feature');
        await ResourcesPage.openEditByDoubleClickResource('resource1');
        await DoceditPage.clickDuplicateDocument();
        await DoceditPage.typeInNumberOfDuplicates('2');
        await DoceditPage.clickConfirmDuplicateInModal();

        await waitForExist(await ResourcesPage.getListItemEl('resource1'));
        await waitForExist(await ResourcesPage.getListItemEl('resource2'));
        await waitForExist(await ResourcesPage.getListItemEl('resource3'));
    });


    test('create two instances of a new resource', async () => {

        await ResourcesPage.clickCreateResource();
        await ResourcesPage.clickSelectCategory();
        await ResourcesPage.clickSelectGeometryType();
        await DoceditPage.typeInInputField('identifier', 'resource1');
        await DoceditPage.clickDuplicateDocument();
        await DoceditPage.typeInNumberOfDuplicates('2');
        await DoceditPage.clickConfirmDuplicateInModal();

        await waitForExist(await ResourcesPage.getListItemEl('resource1'));
        await waitForExist(await ResourcesPage.getListItemEl('resource2'));
    });


    test('contextMenu/moveModal - move a resource with children to another operation', async () => {

        await ResourcesPage.clickOpenContextMenu('SE0');
        await ResourcesPage.clickContextMenuMoveButton();
        await MoveModalPage.typeInSearchBarInput('S2');
        await pause(2000);
        await MoveModalPage.clickResourceListItem('S2');
        await waitForNotExist(await MoveModalPage.getModal());

        await pause(2000);
        const label = await NavbarPage.getActiveNavLinkLabel();
        expect(label).toContain('S2');
        await pause(2000);
        let elements = await ResourcesPage.getListItemEls();
        expect(await elements.count()).toBe(7);
        await pause(2000);

        await ResourcesPage.clickHierarchyButton('SE0');
        elements = await ResourcesPage.getListItemEls();
        expect(await elements.count()).toBe(1);

        await NavbarPage.clickTab('project');
        await ResourcesPage.clickHierarchyButton('S1');
        elements = await ResourcesPage.getListItemEls();
        expect(await elements.count()).toBe(0);
    });


    test('contextMenu/moveModal - move an operation to root level', async () => {

        await NavbarPage.clickTab('project');
        await ResourcesPage.performCreateResource('P1', 'place');
        await ResourcesPage.clickOpenContextMenu('S1');
        await ResourcesPage.clickContextMenuMoveButton();
        await MoveModalPage.typeInSearchBarInput('P');

        let labels = await MoveModalPage.getResourceIdentifierLabels();
        for (let i = 0; i < await labels.count(); i++) {
            expect(await getText(labels.nth(0))).not.toEqual('Projekt');
        }

        await MoveModalPage.typeInSearchBarInput('P1');
        await MoveModalPage.clickResourceListItem('P1');
        await waitForNotExist(await MoveModalPage.getModal());
        let elements = await ResourcesPage.getListItemEls();
        expect(await elements.count()).toBe(1);

        await ResourcesPage.clickOpenContextMenu('S1');
        await ResourcesPage.clickContextMenuMoveButton();
        await MoveModalPage.typeInSearchBarInput('P');
        labels = await MoveModalPage.getResourceIdentifierLabels();
        expect(await getText(labels.nth(0))).toEqual('Projekt');

        await MoveModalPage.clickResourceListItem('Projekt');
        await waitForNotExist(await MoveModalPage.getModal());
        elements = await ResourcesPage.getListItemEls();
        expect(await elements.count()).toBe(5);
    });


    test('contextMenu/moveModal - show only category filter options for allowed parent categories in move modal', async () => {

        await ResourcesPage.clickOpenContextMenu('SE0');
        await ResourcesPage.clickContextMenuMoveButton();
        await SearchBarPage.clickCategoryFilterButton('modal');

        let labels = await SearchBarPage.getCategoryFilterOptionLabels();
        expect(await labels.count()).toBe(8);
        expect(await getText(labels.nth(0))).toEqual('Schnitt');
        expect(await getText(labels.nth(1))).toEqual('Befundkomplex');
        expect(await getText(labels.nth(2))).toEqual('Stratigraphische Einheit');

        await SearchBarPage.clickCategoryFilterButton('modal');
        await MoveModalPage.clickCancel();

        await NavbarPage.clickTab('project');
        await ResourcesPage.clickOpenContextMenu('S1');
        await ResourcesPage.clickContextMenuMoveButton();
        await SearchBarPage.clickCategoryFilterButton('modal');
        labels = await SearchBarPage.getCategoryFilterOptionLabels();
        expect(await labels.count()).toBe(1);
        expect(await getText(labels.nth(0))).toEqual('Ort');

        await SearchBarPage.clickCategoryFilterButton('modal');
        await MoveModalPage.clickCancel();

        await ResourcesPage.clickHierarchyButton('B1');
        await ResourcesPage.clickHierarchyButton('R1');
        await ResourcesPage.performCreateResource('Floor1', 'roomfloor');
        await ResourcesPage.clickOpenContextMenu('Floor1');
        await ResourcesPage.clickContextMenuMoveButton();
        await SearchBarPage.clickCategoryFilterButton('modal');
        
        labels = await SearchBarPage.getCategoryFilterOptionLabels();
        expect(await labels.count()).toBe(4);
        expect(await getText(labels.nth(0))).toEqual('Bauwerk');
        expect(await getText(labels.nth(1))).toEqual('Bauwerksteil');
        expect(await getText(labels.nth(2))).toEqual('Stockwerk');
        expect(await getText(labels.nth(3))).toEqual('Raum');

        await SearchBarPage.clickCategoryFilterButton('modal');
        await MoveModalPage.clickCancel();
    });


    test('contextMenu/moveModal - do not suggest current parent resource', async () => {

        await ResourcesPage.clickOpenContextMenu('SE0');
        await ResourcesPage.clickContextMenuMoveButton();
        await SearchBarPage.clickChooseCategoryFilter('operation-trench', 'modal');

        let labels = await MoveModalPage.getResourceIdentifierLabels();
        for (let i = 0; i < await labels.count(); i++) {
            expect(await getText(labels.nth(i))).not.toEqual('S1');
        }

        await MoveModalPage.clickCancel();
        await ResourcesPage.clickHierarchyButton('SE0');
        await ResourcesPage.clickOpenContextMenu('testf1');
        await ResourcesPage.clickContextMenuMoveButton();
        await SearchBarPage.clickChooseCategoryFilter('feature', 'modal');

        labels = await MoveModalPage.getResourceIdentifierLabels();
        for (let i = 0; i < await labels.count(); i++) {
            expect(await getText(labels.nth(i))).not.toEqual('SE0');
        }

        await MoveModalPage.clickCancel();
    });


    test('contextMenu/moveModal - do not suggest descendants of current resource', async () => {

        await ResourcesPage.clickHierarchyButton('SE0');
        await ResourcesPage.performCreateResource('SE-D1', 'feature');
        await ResourcesPage.clickHierarchyButton('SE-D1');
        await ResourcesPage.performCreateResource('SE-D2', 'feature');

        await ResourcesPage.clickOperationNavigationButton();
        await ResourcesPage.clickOpenContextMenu('SE0');
        await ResourcesPage.clickContextMenuMoveButton();
        await SearchBarPage.clickChooseCategoryFilter('feature', 'modal');

        const labels = await MoveModalPage.getResourceIdentifierLabels();
        for (let i = 0; i < await labels.count(); i++) {
            expect(await getText(labels.nth(i))).not.toEqual('SE-D1');
            expect(await getText(labels.nth(i))).not.toEqual('SE-D2');
        }

        await MoveModalPage.clickCancel();
    });


    test('contextMenu/moveModal - prevent moving child resources to an unallowed operation', async () => {

        await NavbarPage.clickTab('project');
        await ResourcesPage.clickHierarchyButton('B1');
        await ResourcesPage.performCreateResource('BW1', 'buildingpart');
        await ResourcesPage.clickHierarchyButton('BW1');
        await ResourcesPage.performCreateResource('R2', 'room');

        await ResourcesPage.clickOperationNavigationButton();
        await ResourcesPage.clickOpenContextMenu('BW1');
        await ResourcesPage.clickContextMenuMoveButton();
        await SearchBarPage.clickChooseCategoryFilter('operation-survey', 'modal');
        await MoveModalPage.clickResourceListItem('A1');
        await waitForNotExist(await MoveModalPage.getModal());

        await NavbarPage.awaitAlert('kann nicht verschoben werden', false);
    });


    test('images', async () => {

        // create links for images
        await addTwoImages('SE0');
        await ResourcesPage.clickSelectResource('SE0');
        await ResourcesPage.clickThumbnail();
        let images = await ImageRowPage.getImages();
        expect(await images.count()).toBe(2);

        await ImageViewPage.clickCloseButton();

        // delete links to one image
        await ResourcesPage.clickOpenContextMenu('SE0');
        await ResourcesPage.clickContextMenuImagesButton();

        await ImageViewModalPage.waitForCells();
        await click((await ImageViewModalPage.getCells()).nth(0));
        await ImageViewModalPage.clickDeleteImages();
        await pause(2000);
        let cells = await ImageViewModalPage.getCells();
        expect(await cells.count()).toBe(1);
        ImageViewModalPage.clickCloseButton();

        await ResourcesPage.clickThumbnail();
        images = await ImageRowPage.getImages();
        expect(await images.count()).toBe(1);

        await ImageViewModalPage.clickCloseButton();

        // delete links to the other
        await waitForExist(await ResourcesPage.getThumbnail());

        await ResourcesPage.clickOpenContextMenu('SE0');
        await ResourcesPage.clickContextMenuImagesButton();
        await ImageViewModalPage.waitForCells();
        await click((await ImageViewModalPage.getCells()).nth(0));
        await ImageViewModalPage.clickDeleteImages();
        cells = await ImageViewModalPage.getCells();
        expect(await cells.count()).toBe(0);

        await ImageViewModalPage.clickCloseButton();

        await waitForNotExist(await ResourcesPage.getThumbnail());
    });


    test('show children in fields view', async () => {

        await ResourcesPage.clickSelectResource('SE0');
        await FieldsViewPage.clickAccordionTab(1);
        let relations = await FieldsViewPage.getRelations(1);
        expect(await relations.count()).toBe(1);
        expect(await FieldsViewPage.getRelationName(1, 0)).toBe('Untergeordnete Ressourcen')
        expect(await FieldsViewPage.getRelationValue(1, 0)).toBe('testf1');

        await NavbarPage.clickTab('project');

        await ResourcesPage.clickSelectResource('S2');
        await FieldsViewPage.clickAccordionTab(1);
        relations = await FieldsViewPage.getRelations(1);
        expect(await relations.count()).toBe(6);
        expect(await FieldsViewPage.getRelationName(1, 0)).toBe('Untergeordnete Ressourcen')
        expect(await FieldsViewPage.getRelationValue(1, 0)).toBe('SE1');
        expect(await FieldsViewPage.getRelationValue(1, 1)).toBe('SE2');
        expect(await FieldsViewPage.getRelationValue(1, 2)).toBe('SE3');
        expect(await FieldsViewPage.getRelationValue(1, 3)).toBe('SE4');
        expect(await FieldsViewPage.getRelationValue(1, 4)).toBe('SE5');
        expect(await FieldsViewPage.getRelationValue(1, 5)).toBe('SE6');
    });


    test('show stratigraphical units present in profile', async () => {

        await ResourcesPage.performCreateResource('P1', 'profile');
        await ResourcesPage.openEditByDoubleClickResource('SE0');
        await DoceditPage.clickGotoPositionTab();
        await DoceditRelationsPage.clickAddRelationForGroupWithIndex('isPresentIn');
        await DoceditRelationsPage.typeInRelation('isPresentIn', 'P1');
        await DoceditRelationsPage.clickChooseRelationSuggestion(0);
        await DoceditPage.clickSaveDocument();

        await ResourcesPage.clickSelectResource('P1');
        await FieldsViewPage.clickAccordionTab(1);
        let relations = await FieldsViewPage.getRelations(1);
        expect(await relations.count()).toBe(1);
        expect(await FieldsViewPage.getRelationName(1, 0)).toBe('Umfasst stratigraphische Einheiten')
        expect(await FieldsViewPage.getRelationValue(1, 0)).toBe('SE0');
    });


    test('sort values of checkbox fields in fields view', async () => {

        await ResourcesPage.performCreateResource('Pottery1', 'find-pottery');
        await ResourcesPage.openEditByDoubleClickResource('Pottery1');
        await DoceditPage.clickGotoPropertiesTab();
        await DoceditPage.clickCheckbox('manufacturing', 2);
        await DoceditPage.clickCheckbox('manufacturing', 0);
        await DoceditPage.clickCheckbox('manufacturing', 3);
        await DoceditPage.clickCheckbox('manufacturing', 1);
        await DoceditPage.clickSaveDocument();

        await ResourcesPage.clickSelectResource('Pottery1');
        await FieldsViewPage.clickAccordionTab(1);
        expect(await FieldsViewPage.getFieldValue(1, 0, 0)).toBe('Dickwandig');
        expect(await FieldsViewPage.getFieldValue(1, 0, 1)).toBe('Dünnwandig');
        expect(await FieldsViewPage.getFieldValue(1, 0, 2)).toBe('Gebrannt');
        expect(await FieldsViewPage.getFieldValue(1, 0, 3)).toBe('Hart gebrannt');
    });
});
