import { click, getText, navigateTo, pause, resetApp, resetConfigJson, start, stop, waitForExist,
    waitForNotExist } from '../app';
import { NavbarPage } from '../navbar.page';
import { SearchBarPage } from '../widgets/search-bar.page';
import { ResourcesPage } from './resources.page';
import { ImageOverviewPage } from '../images/image-overview.page';
import { DoceditPage } from '../docedit/docedit.page';
import { ResourcesSearchBarPage } from './resources-search-bar.page';
import { SearchConstraintsPage } from '../widgets/search-constraints.page';
import { FieldsViewPage } from '../widgets/fields-view.page';
import { ImageViewPage } from '../images/image-view.page';
import { MoveModalPage } from '../widgets/move-modal.page';

const { test, expect } = require('@playwright/test');


/**
 * filter
 * suggestions
 * search/list
 * filter
 * navpath
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
test.describe('resources/state --', () => {

    test.beforeAll(async () => {

        await start();
    });


    test.beforeEach(async () => {

        await navigateTo('settings');
        await resetApp();
        await NavbarPage.clickCloseNonResourcesTab();
        await NavbarPage.clickTab('project');
    });


    test.afterEach(async () => {

        await resetConfigJson();
    });


    test.afterAll(async () => {

        await stop();
    });


    async function createDepictsRelation() {

        await navigateTo('images');
        await ImageOverviewPage.createDepictsRelation('S1');
    }


    async function clickDepictsRelationLink() {

        await ImageOverviewPage.doubleClickCell(0);
        await ImageViewPage.openRelationsTab();
        await ImageViewPage.clickRelation();
    }


    test('filter', async () => {

        // map
        await ResourcesPage.clickHierarchyButton('S1');
        await ResourcesPage.performCreateResource('1');
        await SearchBarPage.typeInSearchField('1');
        await pause(1000);
        await waitForExist(await ResourcesPage.getListItemEl('1'));

        // list
        await NavbarPage.clickTab('project');
        await ResourcesPage.clickHierarchyButton('S2');
        await ResourcesPage.clickListModeButton();

        // fulltext
        await waitForExist(await ResourcesPage.getListItemEl('SE2'));
        await SearchBarPage.typeInSearchField('SE1');
        await waitForNotExist(await ResourcesPage.getListItemEl('SE2'));

        // filter
        await SearchBarPage.typeInSearchField(' ');
        await waitForExist(await ResourcesPage.getListItemEl('SE2'));
        await SearchBarPage.clickChooseCategoryFilter('feature-architecture');
        await waitForNotExist(await ResourcesPage.getListItemEl('SE2'));
    });


    test('filter - suggestions', async () => {

        // show suggestion for resource from different context
        await SearchBarPage.typeInSearchField('SE0');
        await waitForExist(await ResourcesSearchBarPage.getSuggestionsBox());
        let suggestions = await ResourcesSearchBarPage.getSuggestions();
        expect(await suggestions.count()).toBe(1);
        expect(await getText(suggestions.nth(0))).toEqual('SE0');

        // do not show suggestions if any resources in current context are found
        await SearchBarPage.typeInSearchField('S');
        await waitForExist(await ResourcesPage.getListItemEl('S1'));
        await waitForNotExist(await ResourcesSearchBarPage.getSuggestionsBox());
        suggestions = await ResourcesSearchBarPage.getSuggestions();
        expect(await suggestions.count()).toBe(0);

        // do not suggest project document
        await SearchBarPage.typeInSearchField('te');
        await waitForExist(await ResourcesSearchBarPage.getSuggestionsBox());
        suggestions = await ResourcesSearchBarPage.getSuggestions();
        expect(await suggestions.count()).toBe(1);
        expect(await getText(suggestions.nth(0))).toEqual('testf1');

        // delete query string after following suggestion link
        await SearchBarPage.typeInSearchField('SE0');
        await waitForExist(await ResourcesSearchBarPage.getSuggestionsBox());
        await ResourcesSearchBarPage.clickFirstSuggestion();

        await NavbarPage.clickTab('project');
        expect(await SearchBarPage.getSearchBarInputFieldValue()).toEqual('');
    });


    test('filter -- select all', async () => {

        await ResourcesPage.clickHierarchyButton('S1');

        await ResourcesPage.performCreateResource('1', 'feature-architecture');
        await ResourcesPage.performCreateResource('2', 'feature-floor');
        await SearchBarPage.clickChooseCategoryFilter('inscription');
        await waitForNotExist(await ResourcesPage.getListItemEl('1'));
        await waitForNotExist(await ResourcesPage.getListItemEl('2'));
        await SearchBarPage.clickChooseCategoryFilter('all');
        await waitForExist(await ResourcesPage.getListItemEl('1'));
        await waitForExist(await ResourcesPage.getListItemEl('2'));
    });


    test('filter -- show correct categories in plus button menu after choosing category filter', async () => {

        await ResourcesPage.clickHierarchyButton('S1');

        const checkCategoryOptions = async () => {

            await SearchBarPage.clickChooseCategoryFilter('feature');
            await ResourcesPage.clickCreateResource();
            await waitForExist(await ResourcesPage.getCategoryOption('feature'));
            await waitForExist(await ResourcesPage.getCategoryOption('feature-architecture'));
            await waitForNotExist(await ResourcesPage.getCategoryOption('find'));
            await waitForNotExist(await ResourcesPage.getCategoryOption('find-pottery'));

            await SearchBarPage.clickChooseCategoryFilter('find');
            await ResourcesPage.clickCreateResource();
            await waitForExist(await ResourcesPage.getCategoryOption('find'));
            await waitForExist(await ResourcesPage.getCategoryOption('find-pottery'));
            await waitForNotExist(await ResourcesPage.getCategoryOption('feature'));
            await waitForNotExist(await ResourcesPage.getCategoryOption('feature-architecture'));

            await SearchBarPage.clickChooseCategoryFilter('all');
            await ResourcesPage.clickCreateResource();
            await waitForExist(await ResourcesPage.getCategoryOption('feature'));
            await waitForExist(await ResourcesPage.getCategoryOption('feature-architecture'));
            await waitForExist(await ResourcesPage.getCategoryOption('find'));
            await waitForExist(await ResourcesPage.getCategoryOption('find-pottery'));
        };

        await checkCategoryOptions();
        await ResourcesPage.clickListModeButton();
        await checkCategoryOptions();
    });


    test('filter -- set category of newly created resource to filter category if a child category is chosen as filter category', async () => {

        await ResourcesPage.clickHierarchyButton('S1');

        const checkCategoryIcon = async () => {

            await SearchBarPage.clickChooseCategoryFilter('feature-architecture');
            expect(await ResourcesPage.getCreateDocumentButtonCategoryCharacter()).toEqual('A');

            await SearchBarPage.clickChooseCategoryFilter('feature');
            await waitForNotExist(await ResourcesPage.getCreateDocumentButtonCategoryIcon());

            await SearchBarPage.clickChooseCategoryFilter('all');
            await waitForNotExist(await ResourcesPage.getCreateDocumentButtonCategoryIcon());
        };

        const createResourceWithPresetCategory = async (identifier: string, listMode: boolean) => {

            await SearchBarPage.clickChooseCategoryFilter('feature-layer');
            expect(await ResourcesPage.getCreateDocumentButtonCategoryCharacter()).toEqual('E');
            await ResourcesPage.clickCreateResource();

            if (listMode) {
                await ResourcesPage.typeInNewResourceAndHitEnterInList(identifier);
            } else {
                await ResourcesPage.clickSelectGeometryType();
                await DoceditPage.typeInInputField('identifier', identifier);
                await DoceditPage.clickSaveDocument();
            }
        };

        await checkCategoryIcon();
        await createResourceWithPresetCategory('1', false);
        await ResourcesPage.clickSelectResource('1');
        expect(await FieldsViewPage.getFieldValue(0, 0)).toEqual('Erdbefund');

        await ResourcesPage.clickListModeButton();
        await checkCategoryIcon();
        await createResourceWithPresetCategory('2', true);
        await ResourcesPage.clickMapModeButton();
        await ResourcesPage.clickSelectResource('2');
        expect(await FieldsViewPage.getFieldValue(0, 0)).toEqual('Erdbefund');
    });


    test('filter -- by parent category', async () => {

        await ResourcesPage.clickHierarchyButton('S1');
        await ResourcesPage.performCreateResource('1', 'feature-architecture');
        await ResourcesPage.performCreateResource('2', 'find-glass');
        await waitForExist(await ResourcesPage.getListItemEl('1'));
        await waitForExist(await ResourcesPage.getListItemEl('2'));
        await SearchBarPage.clickChooseCategoryFilter('feature');
        await waitForNotExist(await ResourcesPage.getListItemEl('2'));
        await waitForExist(await ResourcesPage.getListItemEl('1'));
    });


    test('search -- show suggestion for extended search query', async () => {

        await ResourcesPage.clickSwitchHierarchyMode();

        await ResourcesPage.openEditByDoubleClickResource('SE2');
        await DoceditPage.clickGotoPropertiesTab();
        await DoceditPage.clickSelectOption('layerClassification', 'Brandschicht');
        await DoceditPage.clickSaveDocument();

        await ResourcesPage.clickSwitchHierarchyMode();
        await ResourcesPage.clickHierarchyButton('S1');
        await ResourcesPage.clickSwitchHierarchyMode();

        await SearchBarPage.clickChooseCategoryFilter('feature-layer');
        await SearchConstraintsPage.clickConstraintsMenuButton();
        await SearchConstraintsPage.clickSelectConstraintField('layerClassification');
        await SearchConstraintsPage.clickSelectDropdownValue('Brandschicht');
        await SearchConstraintsPage.clickAddConstraintButton();
        await SearchBarPage.clickSearchBarInputField();
        await SearchBarPage.typeInSearchField('S');

        await waitForExist(await ResourcesSearchBarPage.getSuggestionsBox());
        const suggestions = await ResourcesSearchBarPage.getSuggestions();
        expect(await suggestions.count()).toBe(1);
        expect(await getText(suggestions.nth(0))).toEqual('SE2');
    });


    test('filter - jump into right context', async () => {

        // map - stay in overview
        await NavbarPage.clickTab('project');
        await ResourcesPage.clickSwitchHierarchyMode();
        await ResourcesPage.clickHierarchyButton('S1');
        await waitForExist(await ResourcesPage.getListItemEl('S1'));
        expect(await ResourcesPage.getSelectedListItemIdentifierText()).toBe('S1');

        // list - stay in overview
        await ResourcesPage.clickListModeButton();
        await ResourcesPage.clickSwitchHierarchyMode();
        await ResourcesPage.clickHierarchyButton('S1');
        await waitForExist(await ResourcesPage.getListItemEl('S1'));

        // map - goto other tab and into navpath
        await ResourcesPage.clickMapModeButton();
        await ResourcesPage.clickSwitchHierarchyMode();
        await SearchBarPage.clickChooseCategoryFilter('find');
        await ResourcesPage.clickHierarchyButton('testf1');
        await waitForExist(await ResourcesPage.getListItemEl('testf1'));
        expect(await ResourcesPage.getSelectedListItemIdentifierText()).toBe('testf1');
        let navigationButtons = await ResourcesPage.getNavigationButtons();
        expect(await navigationButtons.count()).toBe(2);
        expect(await getText(navigationButtons.nth(0))).toEqual('S1');
        expect(await getText(navigationButtons.nth(1))).toEqual('SE0');

        // list - goto other tab and into navpath
        await NavbarPage.clickTab('project');
        await ResourcesPage.clickListModeButton();
        await ResourcesPage.clickHierarchyButton('testf1');
        await waitForExist(await ResourcesPage.getListItemEl('testf1'));
        navigationButtons = await ResourcesPage.getNavigationButtons();
        expect(await navigationButtons.count()).toBe(2);
        expect(await getText(navigationButtons.nth(0))).toEqual('S1');
        expect(await getText(navigationButtons.nth(1))).toEqual('SE0');
    });


    test('search -- perform constraint search for input field', async () => {

        await ResourcesPage.clickSwitchHierarchyMode();

        await ResourcesPage.openEditByDoubleClickResource('S1');
        await DoceditPage.typeInInputField('diary', 'testvalue');
        await DoceditPage.clickSaveDocument();

        await SearchBarPage.clickChooseCategoryFilter('operation-trench');
        await SearchConstraintsPage.clickConstraintsMenuButton();
        await SearchConstraintsPage.clickSelectConstraintField('diary');
        await SearchConstraintsPage.typeInConstraintSearchTerm('testvalue');
        await SearchConstraintsPage.clickAddConstraintButton();

        await waitForExist(await ResourcesPage.getListItemEl('S1'));
        await waitForNotExist(await ResourcesPage.getListItemEl('S2'));
    });


    test('search -- perform constraint search for dropdown field', async () => {

        await ResourcesPage.clickSwitchHierarchyMode();

        await ResourcesPage.openEditByDoubleClickResource('SE2');
        await DoceditPage.clickGotoPropertiesTab();
        await DoceditPage.clickSelectOption('layerClassification', 'Brandschicht');
        await DoceditPage.clickSaveDocument();

        await SearchBarPage.clickChooseCategoryFilter('feature-layer');
        await SearchConstraintsPage.clickConstraintsMenuButton();
        await SearchConstraintsPage.clickSelectConstraintField('layerClassification');
        await SearchConstraintsPage.clickSelectDropdownValue('Brandschicht');
        await SearchConstraintsPage.clickAddConstraintButton();

        await waitForExist(await ResourcesPage.getListItemEl('SE2'));
        await waitForNotExist(await ResourcesPage.getListItemEl('SE5'));
    });


    test('search -- perform constraint search for boolean field', async () => {

        await ResourcesPage.clickSwitchHierarchyMode();

        await ResourcesPage.openEditByDoubleClickResource('SE0');
        await DoceditPage.clickGotoPropertiesTab();
        await DoceditPage.clickBooleanRadioButton('hasDisturbance', 0);
        await DoceditPage.clickSaveDocument();
        await ResourcesPage.openEditByDoubleClickResource('SE1');
        await DoceditPage.clickGotoPropertiesTab();
        await DoceditPage.clickBooleanRadioButton('hasDisturbance', 1);
        await DoceditPage.clickSaveDocument();

        await SearchBarPage.clickChooseCategoryFilter('feature');
        await SearchConstraintsPage.clickConstraintsMenuButton();
        await SearchConstraintsPage.clickSelectConstraintField('hasDisturbance');
        await SearchConstraintsPage.clickSelectBooleanValue(true);
        await SearchConstraintsPage.clickAddConstraintButton();

        await waitForExist(await ResourcesPage.getListItemEl('SE0'));
        await waitForNotExist(await ResourcesPage.getListItemEl('SE1'));

        await SearchConstraintsPage.clickRemoveConstraintButton('hasDisturbance');

        await waitForExist(await ResourcesPage.getListItemEl('SE0'));
        await waitForExist(await ResourcesPage.getListItemEl('SE1'));

        await SearchConstraintsPage.clickSelectConstraintField('hasDisturbance');
        await SearchConstraintsPage.clickSelectBooleanValue(false);
        await SearchConstraintsPage.clickAddConstraintButton();

        await waitForNotExist(await ResourcesPage.getListItemEl('SE0'));
        await waitForExist(await ResourcesPage.getListItemEl('SE1'));
    });


    test('search -- perform constraint search for default field "has children"', async () => {

        await ResourcesPage.performCreateResource('S3', 'operation-trench');
        await ResourcesPage.clickHierarchyButton('S3');
        await ResourcesPage.performCreateResource('FeatureWithoutChildren', 'feature');
        await ResourcesPage.performCreateResource('FeatureWithChildren', 'feature');
        await ResourcesPage.clickHierarchyButton('FeatureWithChildren');
        await ResourcesPage.performCreateResource('Find', 'find');

        await ResourcesPage.clickSwitchHierarchyMode();

        await SearchConstraintsPage.clickConstraintsMenuButton();
        await SearchConstraintsPage.clickSelectConstraintField('isChildOf');
        await SearchConstraintsPage.clickSelectExistsDropdownValue(true);
        await SearchConstraintsPage.clickAddConstraintButton();

        await waitForExist(await ResourcesPage.getListItemEl('FeatureWithChildren'));
        await waitForNotExist(await ResourcesPage.getListItemEl('FeatureWithoutChildren'));

        await SearchConstraintsPage.clickRemoveConstraintButton('isChildOf');

        await waitForExist(await ResourcesPage.getListItemEl('FeatureWithChildren'));
        await waitForExist(await ResourcesPage.getListItemEl('FeatureWithoutChildren'));

        await SearchConstraintsPage.clickSelectConstraintField('isChildOf');
        await SearchConstraintsPage.clickSelectExistsDropdownValue(false);
        await SearchConstraintsPage.clickAddConstraintButton();

        await waitForNotExist(await ResourcesPage.getListItemEl('FeatureWithChildren'));
        await waitForExist(await ResourcesPage.getListItemEl('FeatureWithoutChildren'));
    });


    test('search -- remove field from dropdown after adding constraint', async () => {

        await ResourcesPage.clickSwitchHierarchyMode();

        await SearchBarPage.clickChooseCategoryFilter('operation-trench');
        await SearchConstraintsPage.clickConstraintsMenuButton();
        await SearchConstraintsPage.clickSelectConstraintField('diary');
        await SearchConstraintsPage.typeInConstraintSearchTerm('testvalue');
        await SearchConstraintsPage.clickAddConstraintButton();

        await waitForNotExist(await SearchConstraintsPage.getConstraintFieldOption('diary'));
    });


    test('search -- remove constraints after filter category has been deselected', async () => {

        await ResourcesPage.clickSwitchHierarchyMode();

        await SearchBarPage.clickChooseCategoryFilter('feature');
        await SearchConstraintsPage.clickConstraintsMenuButton();
        await SearchConstraintsPage.clickSelectConstraintField('hasDisturbance');
        await SearchConstraintsPage.clickSelectBooleanValue(true);
        await SearchConstraintsPage.clickAddConstraintButton();
        await waitForExist(await SearchConstraintsPage.getRemoveConstraintButton('hasDisturbance'));

        await SearchBarPage.clickChooseCategoryFilter('all');
        await SearchConstraintsPage.clickConstraintsMenuButton();
        await waitForNotExist(await SearchConstraintsPage.getRemoveConstraintButton('hasDisturbance'));
    });


    test('search -- remove constraints if invalid after filter category change', async () => {

        await ResourcesPage.clickSwitchHierarchyMode();

        await SearchConstraintsPage.clickConstraintsMenuButton();
        await SearchConstraintsPage.clickSelectConstraintField('geometry');
        await SearchConstraintsPage.clickSelectExistsDropdownValue(true);
        await SearchConstraintsPage.clickAddConstraintButton();

        await SearchBarPage.clickChooseCategoryFilter('feature');
        await SearchConstraintsPage.clickConstraintsMenuButton();
        await waitForExist(await SearchConstraintsPage.getRemoveConstraintButton('geometry'));

        await SearchConstraintsPage.clickSelectConstraintField('hasDisturbance');
        await SearchConstraintsPage.clickSelectBooleanValue(true);
        await SearchConstraintsPage.clickAddConstraintButton();

        await SearchBarPage.clickChooseCategoryFilter('feature-layer');
        await SearchConstraintsPage.clickConstraintsMenuButton();
        await waitForExist(await SearchConstraintsPage.getRemoveConstraintButton('geometry'));
        await waitForExist(await SearchConstraintsPage.getRemoveConstraintButton('hasDisturbance'));

        await SearchBarPage.clickChooseCategoryFilter('find');
        await SearchConstraintsPage.clickConstraintsMenuButton();
        await waitForExist(await SearchConstraintsPage.getRemoveConstraintButton('geometry'));
        await waitForNotExist(await SearchConstraintsPage.getRemoveConstraintButton('hasDisturbance'));
    });


    test('switch from image to map view after click on depicts relation link', async () => {

        await createDepictsRelation();
        await clickDepictsRelationLink();
        await waitForExist(await ResourcesPage.getListItemEl('S1'));
    });


    test('invalidate filter (if necessary) when switching from image to map view after click on depicts relation link', async () => {

        await waitForExist(await ResourcesPage.getListItemEl('S1'));
        await SearchBarPage.clickChooseCategoryFilter('place');
        await waitForNotExist(await ResourcesPage.getListItemEl('S1'));

        await createDepictsRelation();
        await clickDepictsRelationLink();
        await waitForExist(await ResourcesPage.getListItemEl('S1'));
    });


    test('invalidate query string (if necessary) when switching from image to map view after click on depicts relation link', async () => {

        await waitForExist(await ResourcesPage.getListItemEl('S1'));
        await SearchBarPage.typeInSearchField('xyz');
        await waitForNotExist(await ResourcesPage.getListItemEl('S1'));

        await createDepictsRelation();
        await clickDepictsRelationLink();
        await waitForExist(await ResourcesPage.getListItemEl('S1'));
        expect(await SearchBarPage.getSearchBarInputFieldValue()).toEqual('');
    });


    test('navpath -- show correct navigation path after click on relation link', async () => {

        await ResourcesPage.clickHierarchyButton('S1');

        await ResourcesPage.performCreateResource('c2', 'feature');
        await ResourcesPage.clickHierarchyButton('c2');
        await ResourcesPage.performCreateResource('c3', 'feature');
        await click((await ResourcesPage.getNavigationButtons()).nth(0));

        await ResourcesPage.performCreateResource('c4', 'feature');
        await ResourcesPage.clickHierarchyButton('c4');
        await ResourcesPage.performCreateResource('c5', 'feature');
        await ResourcesPage.performCreateRelation('c5', 'c3', 'isContemporaryWith', true);

        await ResourcesPage.clickSelectResource('c5');
        await FieldsViewPage.clickAccordionTab(1);
        await FieldsViewPage.clickRelation(1, 0);

        await waitForExist(await ResourcesPage.getListItemEl('c3'));
        expect(await ResourcesPage.getSelectedListItemIdentifierText()).toEqual('c3');

        const navigationButtons = await ResourcesPage.getNavigationButtons();
        expect(await navigationButtons.count()).toBe(2);
        expect(await getText(navigationButtons.nth(0))).toEqual('S1');
        expect(await getText(navigationButtons.nth(1))).toEqual('c2');
    });


    test('navpath -- update navigation path after editing resource', async () => {

        await ResourcesPage.clickHierarchyButton('S1');
        await ResourcesPage.clickHierarchyButton('SE0');

        let navigationButtons = await ResourcesPage.getNavigationButtons();
        expect(await navigationButtons.count()).toBe(2);
        expect(await getText(navigationButtons.nth(0))).toEqual('S1');
        expect(await getText(navigationButtons.nth(1))).toEqual('SE0');

        await ResourcesPage.clickOperationNavigationButton();

        await ResourcesPage.openEditByDoubleClickResource('SE0');
        await DoceditPage.typeInInputField('identifier', 'Edit');
        await DoceditPage.clickSaveDocument();

        navigationButtons = await ResourcesPage.getNavigationButtons();
        expect(await navigationButtons.count()).toBe(2);
        expect(await getText(navigationButtons.nth(0))).toEqual('S1');
        expect(await getText(navigationButtons.nth(1))).toEqual('Edit');
    });


    test('navpath -- update navigation path after deleting resource', async () => {

        await ResourcesPage.clickHierarchyButton('S1');
        await ResourcesPage.clickHierarchyButton('SE0');

        let navigationButtons = await ResourcesPage.getNavigationButtons();
        expect(await navigationButtons.count()).toBe(2);
        expect(await getText(navigationButtons.nth(0))).toEqual('S1');
        expect(await getText(navigationButtons.nth(1))).toEqual('SE0');

        await ResourcesPage.clickOperationNavigationButton();

        await ResourcesPage.clickOpenContextMenu('SE0');
        await ResourcesPage.clickContextMenuDeleteButton();
        await ResourcesPage.typeInIdentifierInConfirmDeletionInputField('SE0');
        await ResourcesPage.clickConfirmDeleteInModal();

        await waitForNotExist(await ResourcesPage.getListItemEl('SE0'));
        navigationButtons = await ResourcesPage.getNavigationButtons();
        expect(await navigationButtons.count()).toBe(1);
        expect(await getText(navigationButtons.nth(0))).toEqual('S1');
    });


    test('navpath - update when moving a resource within the same operation', async () => {

        await ResourcesPage.clickHierarchyButton('S1');
        await ResourcesPage.performCreateResource('S-New', 'feature');

        await ResourcesPage.clickHierarchyButton('SE0');
        await ResourcesPage.clickOpenContextMenu('testf1');
        await ResourcesPage.clickContextMenuMoveButton();
        await MoveModalPage.typeInSearchBarInput('S-New');
        await MoveModalPage.clickResourceListItem('S-New');
        await waitForNotExist(await MoveModalPage.getModal());

        const navigationButtons = await ResourcesPage.getNavigationButtons();
        expect(await navigationButtons.count()).toBe(2);
        expect(await getText(navigationButtons.nth(0))).toEqual('S1');
        expect(await getText(navigationButtons.nth(1))).toEqual('S-New');
    });


    test('navpath - update when moving a resource to another operation', async () => {

        await ResourcesPage.clickHierarchyButton('S1');
        await ResourcesPage.clickHierarchyButton('SE0');
        await ResourcesPage.clickOperationNavigationButton();

        await ResourcesPage.clickOpenContextMenu('SE0');
        await ResourcesPage.clickContextMenuMoveButton();
        await MoveModalPage.typeInSearchBarInput('S2');
        await MoveModalPage.clickResourceListItem('S2');
        await waitForNotExist(await MoveModalPage.getModal());

        let navigationButtons = await ResourcesPage.getNavigationButtons();
        expect(await navigationButtons.count()).toBe(1);
        expect(await getText(navigationButtons.nth(0))).toEqual('S2');

        await NavbarPage.clickTab('project');
        await ResourcesPage.clickHierarchyButton('S1');
        navigationButtons = await ResourcesPage.getNavigationButtons();
        expect(await navigationButtons.count()).toBe(1);
        expect(await getText(navigationButtons.nth(0))).toEqual('S1');
    });


    test('navpath/hierarchy - switch between modes', async () => {

        await ResourcesPage.clickHierarchyButton('S1');

        expect(await ResourcesPage.getListItemIdentifierText(0)).toEqual('SE0');
        await ResourcesPage.clickHierarchyButton('SE0');
        expect(await ResourcesPage.getListItemIdentifierText(0)).toEqual('testf1');
        await ResourcesPage.clickSwitchHierarchyMode();
        expect(await ResourcesPage.getListItemIdentifierText(0)).toEqual('SE0');
        expect(await ResourcesPage.getListItemIdentifierText(1)).toEqual('testf1');
    });
});
