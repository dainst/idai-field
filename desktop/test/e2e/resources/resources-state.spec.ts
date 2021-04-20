import { click, getAppDataPath, getText, navigateTo, pause, resetApp, resetConfigJson, start, stop, waitForExist,
    waitForNotExist } from '../app';
import {NavbarPage} from '../navbar.page';
import {SearchBarPage} from '../widgets/search-bar.page';
import {ResourcesPage} from './resources.page';
import {ImageOverviewPage} from '../images/image-overview.page';
import {DoceditPage} from '../docedit/docedit.page';
import {ResourcesSearchBarPage} from './resources-search-bar.page';
import {SearchConstraintsPage} from '../widgets/search-constraints.page';
import {FieldsViewPage} from '../widgets/fields-view.page';
import {ImageViewPage} from '../images/image-view.page';

const fs = require('fs');


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
describe('resources/state --', () => {

    beforeAll(async done => {

        await start();
        done();
    });


    beforeEach(async done => {

        await removeResourcesStateFile();
        await navigateTo('settings');
        await resetApp();
        await NavbarPage.clickCloseNonResourcesTab();
        await NavbarPage.clickTab('project');
        done();
    });


    afterEach(async done => {

        await resetConfigJson();
        done();
    });


    afterAll(async done => {

        await stop();
        done();
    });


    async function removeResourcesStateFile() {

        const filePath = (await getAppDataPath()) + '/resources-state-' + 'abc.json';
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }


    async function createDepictsRelation() {

        await navigateTo('images');
        await ImageOverviewPage.createDepictsRelation('S1');
    }


    async function clickDepictsRelationLink() {

        await ImageOverviewPage.doubleClickCell(0);
        await ImageViewPage.openRelationsTab();
        await ImageViewPage.clickRelation();
    }


    it('filter', async done => {

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

        done();
    });


    it('filter - suggestions', async done => {

        // show suggestion for resource from different context
        await SearchBarPage.typeInSearchField('SE0');
        await waitForExist(await ResourcesSearchBarPage.getSuggestionsBox());
        let suggestions = await ResourcesSearchBarPage.getSuggestions();
        expect(suggestions.length).toBe(1);
        expect(await getText(suggestions[0])).toEqual('SE0');

        // do not show suggestions if any resources in current context are found
        await SearchBarPage.typeInSearchField('S');
        await waitForExist(await ResourcesPage.getListItemEl('S1'));
        await waitForNotExist(await ResourcesSearchBarPage.getSuggestionsBox());
        suggestions = await ResourcesSearchBarPage.getSuggestions();
        expect(suggestions.length).toBe(0);

        // do not suggest project document
        await SearchBarPage.typeInSearchField('te');
        await waitForExist(await ResourcesSearchBarPage.getSuggestionsBox());
        suggestions = await ResourcesSearchBarPage.getSuggestions();
        expect(suggestions.length).toBe(1);
        expect(await getText(suggestions[0])).toEqual('testf1');

        // delete query string after following suggestion link
        await SearchBarPage.typeInSearchField('SE0');
        await waitForExist(await ResourcesSearchBarPage.getSuggestionsBox());
        await ResourcesSearchBarPage.clickFirstSuggestion();

        await NavbarPage.clickTab('project');
        expect(await SearchBarPage.getSearchBarInputFieldValue()).toEqual('');

        done();
    });


    it('filter -- select all', async done => {

        await ResourcesPage.clickHierarchyButton('S1');

        await ResourcesPage.performCreateResource('1', 'feature-architecture');
        await ResourcesPage.performCreateResource('2', 'feature-floor');
        await SearchBarPage.clickChooseCategoryFilter('inscription');
        await waitForNotExist(await ResourcesPage.getListItemEl('1'));
        await waitForNotExist(await ResourcesPage.getListItemEl('2'));
        await SearchBarPage.clickChooseCategoryFilter('all');
        await waitForExist(await ResourcesPage.getListItemEl('1'));
        await waitForExist(await ResourcesPage.getListItemEl('2'));

        done();
    });


    it('filter -- show correct categories in plus button menu after choosing category filter', async done => {

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

        done();
    });


    it('filter -- set category of newly created resource to filter category if a child category is chosen as filter category', async done => {

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
        await ResourcesPage.clickSelectResource('1', 'info');
        expect(await FieldsViewPage.getFieldValue(0, 0)).toEqual('Erdbefund');

        await ResourcesPage.clickListModeButton();
        await checkCategoryIcon();
        await createResourceWithPresetCategory('2', true);
        await ResourcesPage.clickMapModeButton();
        await ResourcesPage.clickSelectResource('2', 'info');
        expect(await FieldsViewPage.getFieldValue(0, 0)).toEqual('Erdbefund');

        done();
    });


    it('filter -- by parent category', async done => {

        await ResourcesPage.clickHierarchyButton('S1');
        await ResourcesPage.performCreateResource('1', 'feature-architecture');
        await ResourcesPage.performCreateResource('2', 'find-glass');
        await waitForExist(await ResourcesPage.getListItemEl('1'));
        await waitForExist(await ResourcesPage.getListItemEl('2'));
        await SearchBarPage.clickChooseCategoryFilter('feature');
        await waitForNotExist(await ResourcesPage.getListItemEl('2'));
        await waitForExist(await ResourcesPage.getListItemEl('1'));

        done();
    });


    it('search -- show suggestion for extended search query', async done => {

        await ResourcesPage.clickSwitchHierarchyMode();

        await ResourcesPage.openEditByDoubleClickResource('SE2');
        await DoceditPage.clickGotoChildTab();
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

        await waitForExist(await ResourcesSearchBarPage.getSuggestionsBox());
        const suggestions = await ResourcesSearchBarPage.getSuggestions();
        expect(suggestions.length).toBe(1);
        expect(await getText(suggestions[0])).toEqual('SE2');

        done();
    });


    it('filter - jump into right context', async done => {

        // map - stay in overview
        await NavbarPage.clickTab('project');
        await ResourcesPage.clickSwitchHierarchyMode();
        await ResourcesPage.clickHierarchyButton('S1');
        await waitForExist(await ResourcesPage.getListItemEl('S1'));
        let text = await ResourcesPage.getSelectedListItemIdentifierText();
        expect(text).toBe('S1');

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
        text = await ResourcesPage.getSelectedListItemIdentifierText();
        expect(text).toBe('testf1');
        let navigationButtons = await ResourcesPage.getNavigationButtons();
        expect(navigationButtons.length).toBe(2);
        expect(await getText(navigationButtons[0])).toEqual('S1');
        expect(await getText(navigationButtons[1])).toEqual('SE0');

        // list - goto other tab and into navpath
        await NavbarPage.clickTab('project');
        await ResourcesPage.clickListModeButton();
        await ResourcesPage.clickHierarchyButton('testf1');
        await waitForExist(await ResourcesPage.getListItemEl('testf1'));
        navigationButtons = await ResourcesPage.getNavigationButtons();
        expect(navigationButtons.length).toBe(2);
        expect(await getText(navigationButtons[0])).toEqual('S1');
        expect(await getText(navigationButtons[1])).toEqual('SE0');

        done();
    });


    it('search -- perform constraint search for simple input field', async done => {

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

        done();
    });


    it('search -- perform constraint search for dropdown field', async done => {

        await ResourcesPage.clickSwitchHierarchyMode();

        await ResourcesPage.openEditByDoubleClickResource('SE2');
        await DoceditPage.clickGotoChildTab();
        await DoceditPage.clickSelectOption('layerClassification', 'Brandschicht');
        await DoceditPage.clickSaveDocument();

        await SearchBarPage.clickChooseCategoryFilter('feature-layer');
        await SearchConstraintsPage.clickConstraintsMenuButton();
        await SearchConstraintsPage.clickSelectConstraintField('layerClassification');
        await SearchConstraintsPage.clickSelectDropdownValue('Brandschicht');
        await SearchConstraintsPage.clickAddConstraintButton();

        await waitForExist(await ResourcesPage.getListItemEl('SE2'));
        await waitForNotExist(await ResourcesPage.getListItemEl('SE5'));

        done();
    });


    it('search -- perform constraint search for boolean field', async done => {

        await ResourcesPage.clickSwitchHierarchyMode();

        await ResourcesPage.openEditByDoubleClickResource('SE0');
        await DoceditPage.clickGotoParentTab();
        await DoceditPage.clickBooleanRadioButton('hasDisturbance', 0);
        await DoceditPage.clickSaveDocument();
        await ResourcesPage.openEditByDoubleClickResource('SE1');
        await DoceditPage.clickGotoParentTab();
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

        done();
    });


    it('search -- remove field from dropdown after adding constraint', async done => {

        await ResourcesPage.clickSwitchHierarchyMode();

        await SearchBarPage.clickChooseCategoryFilter('operation-trench');
        await SearchConstraintsPage.clickConstraintsMenuButton();
        await SearchConstraintsPage.clickSelectConstraintField('diary');
        await SearchConstraintsPage.typeInConstraintSearchTerm('testvalue');
        await SearchConstraintsPage.clickAddConstraintButton();

        await waitForNotExist(await SearchConstraintsPage.getConstraintFieldOption('diary'));

        done();
    });


    it('search -- remove constraints if invalid after filter category change', async done => {

        await ResourcesPage.clickSwitchHierarchyMode();

        await SearchConstraintsPage.clickConstraintsMenuButton();
        await SearchConstraintsPage.clickSelectConstraintField('geometry');
        await SearchConstraintsPage.clickSelectExistsDropdownValue('KNOWN');
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

        done();
    });


    it('switch from image to map view after click on depicts relation link', async done => {

        await createDepictsRelation();
        await clickDepictsRelationLink();
        await waitForExist(await ResourcesPage.getListItemEl('S1'));

        done();
    });


    it('invalidate filter (if necessary) when switching from image to map view after click on depicts relation link', async done => {

        await waitForExist(await ResourcesPage.getListItemEl('S1'));
        await SearchBarPage.clickChooseCategoryFilter('place');
        await waitForNotExist(await ResourcesPage.getListItemEl('S1'));

        await createDepictsRelation();
        await clickDepictsRelationLink();
        await waitForExist(await ResourcesPage.getListItemEl('S1'));

        done();
    });


    it('invalidate query string (if necessary) when switching from image to map view after click on depicts relation link', async done => {

        await waitForExist(await ResourcesPage.getListItemEl('S1'));
        await SearchBarPage.typeInSearchField('xyz');
        await waitForNotExist(await ResourcesPage.getListItemEl('S1'));

        await createDepictsRelation();
        await clickDepictsRelationLink();
        await waitForExist(await ResourcesPage.getListItemEl('S1'));
        const value = await SearchBarPage.getSearchBarInputFieldValue();
        expect(value).toEqual('');

        done();
    });


    it('navpath -- show correct navigation path after click on relation link', async done => {

        await ResourcesPage.clickHierarchyButton('S1');

        await ResourcesPage.performCreateResource('c2', 'feature');
        await ResourcesPage.performDescendHierarchy('c2');
        await ResourcesPage.performCreateResource('c3', 'feature');
        await click((await ResourcesPage.getNavigationButtons())[0]);

        await ResourcesPage.performCreateResource('c4', 'feature');
        await ResourcesPage.performDescendHierarchy('c4');
        await ResourcesPage.performCreateResource('c5', 'feature');
        await ResourcesPage.performCreateRelation('c5', 'c3', 'zeitgleich-mit');

        await ResourcesPage.clickSelectResource('c5', 'info');
        await FieldsViewPage.clickAccordionTab(1);
        await FieldsViewPage.clickRelation(1, 0);

        await waitForExist(await ResourcesPage.getListItemEl('c3'));
        const text = await ResourcesPage.getSelectedListItemIdentifierText();
        expect(text).toEqual('c3');

        const navigationButtons = await ResourcesPage.getNavigationButtons();
        expect(navigationButtons.length).toBe(2);
        expect(await getText(navigationButtons[0])).toEqual('S1');
        expect(await getText(navigationButtons[1])).toEqual('c2');

        done();
    });


    it('navpath -- update navigation path after editing resource', async done => {

        await ResourcesPage.clickHierarchyButton('S1');
        await ResourcesPage.clickHierarchyButton('SE0');
        await ResourcesPage.clickOpenChildCollectionButton();

        let navigationButtons = await ResourcesPage.getNavigationButtons();
        expect(navigationButtons.length).toBe(2);
        expect(await getText(navigationButtons[0])).toEqual('S1');
        expect(await getText(navigationButtons[1])).toEqual('SE0');

        await ResourcesPage.clickOperationNavigationButton();

        await ResourcesPage.openEditByDoubleClickResource('SE0');
        await DoceditPage.typeInInputField('identifier', 'Edit');
        await DoceditPage.clickSaveDocument();

        navigationButtons = await ResourcesPage.getNavigationButtons();
        expect(navigationButtons.length).toBe(2);
        expect(await getText(navigationButtons[0])).toEqual('S1');
        expect(await getText(navigationButtons[1])).toEqual('Edit');

        done();
    });


    it('navpath -- update navigation path after deleting resource', async done => {

        await ResourcesPage.clickHierarchyButton('S1');
        await ResourcesPage.clickHierarchyButton('SE0');
        await ResourcesPage.clickOpenChildCollectionButton();

        let navigationButtons = await ResourcesPage.getNavigationButtons();
        expect(navigationButtons.length).toBe(2);
        expect(await getText(navigationButtons[0])).toEqual('S1');
        expect(await getText(navigationButtons[1])).toEqual('SE0');

        await ResourcesPage.clickOperationNavigationButton();

        await ResourcesPage.clickOpenContextMenu('SE0');
        await ResourcesPage.clickContextMenuDeleteButton();
        await ResourcesPage.typeInIdentifierInConfirmDeletionInputField('SE0');
        await ResourcesPage.clickConfirmDeleteInModal();

        await waitForNotExist(await ResourcesPage.getListItemEl('SE0'));
        navigationButtons = await ResourcesPage.getNavigationButtons();
        expect(navigationButtons.length).toBe(1);
        expect(await getText(navigationButtons[0])).toEqual('S1');

        done();
    });


    it('navpath - update when moving a resource within the same operation', async done => {

        await ResourcesPage.clickHierarchyButton('S1');
        await ResourcesPage.performCreateResource('S-New', 'feature');

        await ResourcesPage.performDescendHierarchy('SE0');
        await ResourcesPage.clickOpenContextMenu('testf1');
        await ResourcesPage.clickContextMenuMoveButton();
        await ResourcesPage.typeInMoveModalSearchBarInput('S-New');
        await ResourcesPage.clickResourceListItemInMoveModal('S-New');
        await waitForNotExist(await ResourcesPage.getMoveModal());

        const navigationButtons = await ResourcesPage.getNavigationButtons();
        expect(navigationButtons.length).toBe(2);
        expect(await getText(navigationButtons[0])).toEqual('S1');
        expect(await getText(navigationButtons[1])).toEqual('S-New');

        done();
    });


    it('navpath - update when moving a resource to another operation', async done => {

        await ResourcesPage.clickHierarchyButton('S1');
        await ResourcesPage.performDescendHierarchy('SE0');
        await ResourcesPage.clickOperationNavigationButton();

        await ResourcesPage.clickOpenContextMenu('SE0');
        await ResourcesPage.clickContextMenuMoveButton();
        await ResourcesPage.typeInMoveModalSearchBarInput('S2');
        await ResourcesPage.clickResourceListItemInMoveModal('S2');
        await waitForNotExist(await ResourcesPage.getMoveModal());

        let navigationButtons = await ResourcesPage.getNavigationButtons();
        expect(navigationButtons.length).toBe(1);
        expect(await getText(navigationButtons[0])).toEqual('S2');

        await NavbarPage.clickTab('project');
        await ResourcesPage.clickHierarchyButton('S1');
        navigationButtons = await ResourcesPage.getNavigationButtons();
        expect(navigationButtons.length).toBe(1);
        expect(await getText(navigationButtons[0])).toEqual('S1');

        done();
    });


    it('navpath/hierarchy - switch between modes', async done => {

        await ResourcesPage.clickHierarchyButton('S1');

        expect(await ResourcesPage.getListItemIdentifierText(0)).toEqual('SE0');
        await ResourcesPage.performDescendHierarchy('SE0');
        expect(await ResourcesPage.getListItemIdentifierText(0)).toEqual('testf1');
        await ResourcesPage.clickSwitchHierarchyMode();
        expect(await ResourcesPage.getListItemIdentifierText(0)).toEqual('SE0');
        expect(await ResourcesPage.getListItemIdentifierText(1)).toEqual('testf1');

        done();
    });
});
