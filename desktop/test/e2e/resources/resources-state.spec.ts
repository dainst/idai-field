import {browser, protractor} from 'protractor';
import {NavbarPage} from '../navbar.page';
import {MenuPage} from '../menu.page';
import {SearchBarPage} from '../widgets/search-bar.page';
import {ResourcesPage} from './resources.page';
import {ImageOverviewPage} from '../images/image-overview.page';
import {DoceditPage} from '../docedit/docedit.page';
import {ResourcesSearchBarPage} from './resources-search-bar.page';
import {SearchConstraintsPage} from '../widgets/search-constraints.page';
import {FieldsViewPage} from '../widgets/fields-view.page';
import {ImageViewPage} from '../images/image-view.page';

const fs = require('fs');
const delays = require('../delays');
const EC = protractor.ExpectedConditions;
const common = require('../common');

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
describe('resources/state --', function() {

    const appDataPath = browser.params.appDataPath;


    beforeAll(() => {

        removeResourcesStateFile();
    });


    beforeEach(() => {

        browser.sleep(1000);

        MenuPage.navigateToSettings();
        common.resetApp();
        NavbarPage.clickCloseNonResourcesTab();
        NavbarPage.clickTab('project');
    });


    afterEach(done => {

        removeResourcesStateFile();
        common.resetConfigJson().then(done);
    });


    function removeResourcesStateFile() {

        const filePath = appDataPath + '/resources-state-' + 'abc.json';
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }


    function createDepictsRelation() {

        MenuPage.navigateToImages();
        browser.sleep(delays.shortRest * 5);
        ImageOverviewPage.createDepictsRelation('S1');
    }


    function clickDepictsRelationLink() {

        ImageOverviewPage.doubleClickCell(0);
        ImageViewPage.openRelationsTab();
        ImageViewPage.clickRelation();
    }


    it('filter', () => {

        // map
        ResourcesPage.clickHierarchyButton('S1');
        ResourcesPage.performCreateResource('1');
        SearchBarPage.typeInSearchField('1');
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('1')), delays.ECWaitTime);

        // list
        NavbarPage.clickTab('project');
        ResourcesPage.clickHierarchyButton('S2');
        ResourcesPage.clickListModeButton();

        // fulltext
        browser.wait(EC.visibilityOf(ResourcesPage.getListItemEl('SE2')), delays.ECWaitTime);
        SearchBarPage.typeInSearchField('SE1');
        browser.wait(EC.invisibilityOf(ResourcesPage.getListItemEl('SE2')), delays.ECWaitTime);

        // filter
        SearchBarPage.typeInSearchField(' ');
        browser.wait(EC.visibilityOf(ResourcesPage.getListItemEl('SE2')), delays.ECWaitTime);
        SearchBarPage.clickChooseCategoryFilter('feature-architecture');
        browser.wait(EC.invisibilityOf(ResourcesPage.getListItemEl('SE2')), delays.ECWaitTime);
    });


    it('filter - suggestions', async done => {

        // show suggestion for resource from different context
        SearchBarPage.typeInSearchField('SE0');
        browser.wait(EC.presenceOf(ResourcesSearchBarPage.getSuggestionsBox()), delays.ECWaitTime);
        ResourcesSearchBarPage.getSuggestions().then(suggestions => {
            expect(suggestions.length).toBe(1);
            expect(suggestions[0].getText()).toEqual('SE0');
        });

        // do not show suggestions if any resources in current context are found
        SearchBarPage.typeInSearchField('S');
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('S1')), delays.ECWaitTime);
        browser.wait(EC.invisibilityOf(ResourcesSearchBarPage.getSuggestionsBox()), delays.ECWaitTime);
        ResourcesSearchBarPage.getSuggestions().then(suggestions => expect(suggestions.length).toBe(0));

        // do not suggest project document
        SearchBarPage.typeInSearchField('te');
        browser.wait(EC.presenceOf(ResourcesSearchBarPage.getSuggestionsBox()), delays.ECWaitTime);
        ResourcesSearchBarPage.getSuggestions().then(suggestions => {
            expect(suggestions.length).toBe(1);
            expect(suggestions[0].getText()).toEqual('testf1');
        });

        // delete query string after following suggestion link
        SearchBarPage.typeInSearchField('SE0');
        browser.wait(EC.presenceOf(ResourcesSearchBarPage.getSuggestionsBox()), delays.ECWaitTime);
        ResourcesSearchBarPage.clickFirstSuggestion();

        NavbarPage.clickTab('project');
        expect(await SearchBarPage.getSearchBarInputFieldValue()).toEqual('');

        done();
    });


    it('filter -- select all', () => {

        ResourcesPage.clickHierarchyButton('S1');

        ResourcesPage.performCreateResource('1', 'feature-architecture');
        ResourcesPage.performCreateResource('2', 'feature-floor');
        SearchBarPage.clickChooseCategoryFilter('inscription');
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('1')), delays.ECWaitTime);
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('2')), delays.ECWaitTime);
        SearchBarPage.clickChooseCategoryFilter('all');
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('1')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('2')), delays.ECWaitTime);
    });


    it('filter -- show correct categories in plus button menu after choosing category filter', () => {

        ResourcesPage.clickHierarchyButton('S1');

        const checkCategoryOptions = () => {

            SearchBarPage.clickChooseCategoryFilter('feature');
            ResourcesPage.clickCreateResource();
            browser.wait(EC.presenceOf(ResourcesPage.getCategoryOption('feature')), delays.ECWaitTime);
            browser.wait(EC.presenceOf(ResourcesPage.getCategoryOption('feature-architecture')), delays.ECWaitTime);
            browser.wait(EC.stalenessOf(ResourcesPage.getCategoryOption('find')), delays.ECWaitTime);
            browser.wait(EC.stalenessOf(ResourcesPage.getCategoryOption('find-pottery')), delays.ECWaitTime);

            SearchBarPage.clickChooseCategoryFilter('find');
            ResourcesPage.clickCreateResource();
            browser.wait(EC.presenceOf(ResourcesPage.getCategoryOption('find')), delays.ECWaitTime);
            browser.wait(EC.presenceOf(ResourcesPage.getCategoryOption('find-pottery')), delays.ECWaitTime);
            browser.wait(EC.stalenessOf(ResourcesPage.getCategoryOption('feature')), delays.ECWaitTime);
            browser.wait(EC.stalenessOf(ResourcesPage.getCategoryOption('feature-architecture')), delays.ECWaitTime);

            SearchBarPage.clickChooseCategoryFilter('all');
            ResourcesPage.clickCreateResource();
            browser.wait(EC.presenceOf(ResourcesPage.getCategoryOption('feature')), delays.ECWaitTime);
            browser.wait(EC.presenceOf(ResourcesPage.getCategoryOption('feature-architecture')), delays.ECWaitTime);
            browser.wait(EC.presenceOf(ResourcesPage.getCategoryOption('find')), delays.ECWaitTime);
            browser.wait(EC.presenceOf(ResourcesPage.getCategoryOption('find-pottery')), delays.ECWaitTime);
        };

        checkCategoryOptions();
        ResourcesPage.clickListModeButton();
        checkCategoryOptions();
    });


    it('filter -- set category of newly created resource to filter category if a child category is chosen as filter category', () => {

        ResourcesPage.clickHierarchyButton('S1');
        browser.sleep(delays.shortRest * 3);

        const checkCategoryIcon = () => {

            SearchBarPage.clickChooseCategoryFilter('feature-architecture');
            ResourcesPage.getCreateDocumentButtonCategoryCharacter()
                .then(character => expect(character).toEqual('A'));

            SearchBarPage.clickChooseCategoryFilter('feature');
            browser.wait(EC.stalenessOf(ResourcesPage.getCreateDocumentButtonCategoryIcon()), delays.ECWaitTime);

            SearchBarPage.clickChooseCategoryFilter('all');
            browser.wait(EC.stalenessOf(ResourcesPage.getCreateDocumentButtonCategoryIcon()), delays.ECWaitTime);
        };

        const createResourceWithPresetCategory = (identifier: string, listMode: boolean) => {

            SearchBarPage.clickChooseCategoryFilter('feature-layer');
            ResourcesPage.getCreateDocumentButtonCategoryCharacter()
                .then(character => expect(character).toEqual('E'));
            ResourcesPage.clickCreateResource();

            if (listMode) {
                ResourcesPage.typeInNewResourceAndHitEnterInList(identifier);
            } else {
                ResourcesPage.clickSelectGeometryType();
                DoceditPage.typeInInputField('identifier', identifier);
                ResourcesPage.scrollUp();
                DoceditPage.clickSaveDocument();
            }

            browser.sleep(delays.shortRest);
        };

        checkCategoryIcon();
        createResourceWithPresetCategory('1', false);
        ResourcesPage.clickSelectResource('1', 'info');
        FieldsViewPage.getFieldValue(0, 0).then(categoryLabel => {
            expect(categoryLabel).toEqual('Erdbefund');
        });

        ResourcesPage.clickListModeButton();
        checkCategoryIcon();
        createResourceWithPresetCategory('2', true);
        ResourcesPage.clickMapModeButton();
        ResourcesPage.clickSelectResource('2', 'info');
        FieldsViewPage.getFieldValue(0, 0).then(categoryLabel => {
            expect(categoryLabel).toEqual('Erdbefund');
        });
    });


    it('filter -- by parent category', () => {

        ResourcesPage.clickHierarchyButton('S1');
        browser.sleep(delays.shortRest * 3);

        ResourcesPage.performCreateResource('1', 'feature-architecture');
        ResourcesPage.performCreateResource('2', 'find-glass');
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('1')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('2')), delays.ECWaitTime);
        SearchBarPage.clickChooseCategoryFilter('feature');
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('2')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('1')), delays.ECWaitTime);
    });


    it('search -- show suggestion for extended search query', done => {

        ResourcesPage.clickSwitchHierarchyMode();

        ResourcesPage.openEditByDoubleClickResource('SE2');
        DoceditPage.clickGotoChildTab();
        DoceditPage.clickSelectOption('layerClassification', 1);
        DoceditPage.clickSaveDocument();

        ResourcesPage.clickSwitchHierarchyMode();
        ResourcesPage.clickHierarchyButton('S1');
        ResourcesPage.clickSwitchHierarchyMode();

        SearchBarPage.clickChooseCategoryFilter('feature-layer');
        SearchConstraintsPage.clickConstraintsMenuButton();
        SearchConstraintsPage.clickSelectConstraintField('layerClassification');
        SearchConstraintsPage.clickSelectDropdownValue(1);
        SearchConstraintsPage.clickAddConstraintButton();
        SearchBarPage.clickSearchBarInputField();

        browser.wait(EC.presenceOf(ResourcesSearchBarPage.getSuggestionsBox()), delays.ECWaitTime);
        ResourcesSearchBarPage.getSuggestions().then(suggestions => {
            expect(suggestions.length).toBe(1);
            expect(suggestions[0].getText()).toEqual('SE2');
        });

        done();
    });


    it('filter - jump into right context', () => {

        // map - stay in overview
        NavbarPage.clickTab('project');
        ResourcesPage.clickSwitchHierarchyMode();
        ResourcesPage.clickHierarchyButton('S1');
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('S1')));
        ResourcesPage.getSelectedListItemIdentifierText().then(text => expect(text).toBe('S1'));

        // list - stay in overview
        ResourcesPage.clickListModeButton();
        ResourcesPage.clickSwitchHierarchyMode();
        ResourcesPage.clickHierarchyButton('S1');
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('S1')));

        // map - goto other tab and into navpath
        ResourcesPage.clickMapModeButton();
        ResourcesPage.clickSwitchHierarchyMode();
        SearchBarPage.clickChooseCategoryFilter('find');
        ResourcesPage.clickHierarchyButton('testf1');
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('testf1')));
        ResourcesPage.getSelectedListItemIdentifierText().then(text => expect(text).toBe('testf1'));
        ResourcesPage.getNavigationButtons().then(navigationButtons => {
            expect(navigationButtons.length).toBe(2);
            expect(navigationButtons[0].getText()).toEqual('S1');
            expect(navigationButtons[1].getText()).toEqual('SE0');
        });

        // list - goto other tab and into navpath
        NavbarPage.clickTab('project');
        ResourcesPage.clickListModeButton();
        ResourcesPage.clickHierarchyButton('testf1');
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('testf1')));
        ResourcesPage.getNavigationButtons().then(navigationButtons => {
            expect(navigationButtons.length).toBe(2);
            expect(navigationButtons[0].getText()).toEqual('S1');
            expect(navigationButtons[1].getText()).toEqual('SE0');
        });
    });


    it('search -- perform constraint search for simple input field', () => {

        ResourcesPage.clickSwitchHierarchyMode();

        ResourcesPage.openEditByDoubleClickResource('S1');
        DoceditPage.typeInInputField('diary', 'testvalue');
        DoceditPage.clickSaveDocument();

        SearchBarPage.clickChooseCategoryFilter('operation-trench');
        SearchConstraintsPage.clickConstraintsMenuButton();
        SearchConstraintsPage.clickSelectConstraintField('diary');
        SearchConstraintsPage.typeInConstraintSearchTerm('testvalue');
        SearchConstraintsPage.clickAddConstraintButton();

        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('S1')));
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('S2')));
    });


    it('search -- perform constraint search for dropdown field', () => {

        ResourcesPage.clickSwitchHierarchyMode();

        ResourcesPage.openEditByDoubleClickResource('SE2');
        DoceditPage.clickGotoChildTab();
        DoceditPage.clickSelectOption('layerClassification', 1);
        DoceditPage.clickSaveDocument();

        SearchBarPage.clickChooseCategoryFilter('feature-layer');
        SearchConstraintsPage.clickConstraintsMenuButton();
        SearchConstraintsPage.clickSelectConstraintField('layerClassification');
        SearchConstraintsPage.clickSelectDropdownValue(1);
        SearchConstraintsPage.clickAddConstraintButton();

        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('SE2')));
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('SE5')));
    });


    it('search -- perform constraint search for boolean field', () => {

        ResourcesPage.clickSwitchHierarchyMode();

        ResourcesPage.openEditByDoubleClickResource('SE0');
        DoceditPage.clickGotoParentTab();
        DoceditPage.clickBooleanRadioButton('hasDisturbance', 0);
        DoceditPage.clickSaveDocument();
        ResourcesPage.openEditByDoubleClickResource('SE1');
        DoceditPage.clickGotoParentTab();
        DoceditPage.clickBooleanRadioButton('hasDisturbance', 1);
        DoceditPage.clickSaveDocument();

        SearchBarPage.clickChooseCategoryFilter('feature');
        SearchConstraintsPage.clickConstraintsMenuButton();
        SearchConstraintsPage.clickSelectConstraintField('hasDisturbance');
        SearchConstraintsPage.clickSelectBooleanValue(true);
        SearchConstraintsPage.clickAddConstraintButton();

        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('SE0')));
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('SE1')));

        SearchConstraintsPage.clickRemoveConstraintButton('hasDisturbance');

        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('SE0')));
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('SE1')));

        SearchConstraintsPage.clickSelectConstraintField('hasDisturbance');
        SearchConstraintsPage.clickSelectBooleanValue(false);
        SearchConstraintsPage.clickAddConstraintButton();

        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('SE0')));
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('SE1')));
    });


    it('search -- remove field from dropdown after adding constraint', () => {

        ResourcesPage.clickSwitchHierarchyMode();

        SearchBarPage.clickChooseCategoryFilter('operation-trench');
        SearchConstraintsPage.clickConstraintsMenuButton();
        SearchConstraintsPage.clickSelectConstraintField('diary');

        SearchConstraintsPage.typeInConstraintSearchTerm('testvalue');
        SearchConstraintsPage.clickAddConstraintButton();

        browser.wait(EC.stalenessOf(
            SearchConstraintsPage.getConstraintFieldOption('diary')
        ));
    });


    it('search -- remove constraints if invalid after filter category change', () => {

        ResourcesPage.clickSwitchHierarchyMode();

        SearchConstraintsPage.clickConstraintsMenuButton();
        SearchConstraintsPage.clickSelectConstraintField('geometry');
        SearchConstraintsPage.clickSelectExistsDropdownValue(1);
        SearchConstraintsPage.clickAddConstraintButton();

        SearchBarPage.clickChooseCategoryFilter('feature');
        SearchConstraintsPage.clickConstraintsMenuButton();
        browser.wait(EC.presenceOf(SearchConstraintsPage.getRemoveConstraintButton('geometry')),
            delays.ECWaitTime);

        SearchConstraintsPage.clickSelectConstraintField('hasDisturbance');
        SearchConstraintsPage.clickSelectBooleanValue(true);
        SearchConstraintsPage.clickAddConstraintButton();

        SearchBarPage.clickChooseCategoryFilter('feature-layer');
        SearchConstraintsPage.clickConstraintsMenuButton();
        browser.wait(EC.presenceOf(SearchConstraintsPage.getRemoveConstraintButton('geometry')),
            delays.ECWaitTime);
        browser.wait(
            EC.presenceOf(SearchConstraintsPage.getRemoveConstraintButton('hasDisturbance')),
            delays.ECWaitTime
        );

        SearchBarPage.clickChooseCategoryFilter('find');
        SearchConstraintsPage.clickConstraintsMenuButton();
        browser.wait(EC.presenceOf(SearchConstraintsPage.getRemoveConstraintButton('geometry')),
            delays.ECWaitTime);
        browser.wait(
            EC.stalenessOf(SearchConstraintsPage.getRemoveConstraintButton('hasDisturbance')),
            delays.ECWaitTime
        );
    });


    it('switch from image to map view after click on depicts relation link', () => {

        createDepictsRelation();
        clickDepictsRelationLink();
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('S1')), delays.ECWaitTime);
    });


    it('invalidate filter (if necessary) when switching from image to map view after click on depicts relation link', () => {

        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('S1')), delays.ECWaitTime);
        SearchBarPage.clickChooseCategoryFilter('place');
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('S1')), delays.ECWaitTime);

        createDepictsRelation();
        clickDepictsRelationLink();
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('S1')), delays.ECWaitTime);
    });


    it('invalidate query string (if necessary) when switching from image to map view after click on depicts relation link', () => {

        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('S1')), delays.ECWaitTime);
        SearchBarPage.typeInSearchField('xyz');
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('S1')), delays.ECWaitTime);

        createDepictsRelation();
        clickDepictsRelationLink();
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('S1')), delays.ECWaitTime);
        SearchBarPage.getSearchBarInputFieldValue().then(value => expect(value).toEqual(''));
    });


    it('navpath -- show correct navigation path after click on relation link', () => {

        ResourcesPage.clickHierarchyButton('S1');

        ResourcesPage.performCreateResource('c2', 'feature');
        ResourcesPage.performDescendHierarchy('c2');
        ResourcesPage.performCreateResource('c3', 'feature');
        ResourcesPage.getNavigationButtons().get(0).click();

        ResourcesPage.performCreateResource('c4', 'feature');
        ResourcesPage.performDescendHierarchy('c4');
        ResourcesPage.performCreateResource('c5', 'feature');
        ResourcesPage.performCreateRelation('c5', 'c3', 'zeitgleich-mit');

        ResourcesPage.clickSelectResource('c5', 'info');
        FieldsViewPage.clickAccordionTab(1);
        FieldsViewPage.clickRelation(1, 0);

        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('c3')), delays.ECWaitTime);
        ResourcesPage.getSelectedListItemIdentifierText().then(text => expect(text).toEqual('c3'));

        ResourcesPage.getNavigationButtons().then(navigationButtons => {
            expect(navigationButtons.length).toBe(2);
            expect(navigationButtons[0].getText()).toEqual('S1');
            expect(navigationButtons[1].getText()).toEqual('c2');
        });
    });


    it('navpath -- update navigation path after editing resource', () => {

        ResourcesPage.clickHierarchyButton('S1');
        ResourcesPage.clickHierarchyButton('SE0');
        ResourcesPage.clickOpenChildCollectionButton();

        ResourcesPage.getNavigationButtons().then(navigationButtons => {
            expect(navigationButtons.length).toBe(2);
            expect(navigationButtons[0].getText()).toEqual('S1');
            expect(navigationButtons[1].getText()).toEqual('SE0');
        });

        ResourcesPage.clickOperationNavigationButton();

        ResourcesPage.openEditByDoubleClickResource('SE0');
        DoceditPage.typeInInputField('identifier', 'Edit');
        DoceditPage.clickSaveDocument();

        ResourcesPage.getNavigationButtons().then(navigationButtons => {
            expect(navigationButtons.length).toBe(2);
            expect(navigationButtons[0].getText()).toEqual('S1');
            expect(navigationButtons[1].getText()).toEqual('Edit');
        });
    });


    it('navpath -- update navigation path after deleting resource', () => {

        ResourcesPage.clickHierarchyButton('S1');
        ResourcesPage.clickHierarchyButton('SE0');
        ResourcesPage.clickOpenChildCollectionButton();

        ResourcesPage.getNavigationButtons().then(navigationButtons => {
            expect(navigationButtons.length).toBe(2);
            expect(navigationButtons[0].getText()).toEqual('S1');
            expect(navigationButtons[1].getText()).toEqual('SE0');
        });

        ResourcesPage.clickOperationNavigationButton();

        ResourcesPage.clickOpenContextMenu('SE0');
        ResourcesPage.clickContextMenuDeleteButton();
        ResourcesPage.typeInIdentifierInConfirmDeletionInputField('SE0');
        ResourcesPage.clickConfirmDeleteInModal();

        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('SE0')), delays.ECWaitTime);
        ResourcesPage.getNavigationButtons().then(navigationButtons => {
            expect(navigationButtons.length).toBe(1);
            expect(navigationButtons[0].getText()).toEqual('S1');
        });
    });


    it('navpath - update when moving a resource within the same operation', () => {

        ResourcesPage.clickHierarchyButton('S1');
        ResourcesPage.performCreateResource('S-New', 'feature');

        ResourcesPage.performDescendHierarchy('SE0');
        ResourcesPage.clickOpenContextMenu('testf1');
        ResourcesPage.clickContextMenuMoveButton();
        ResourcesPage.typeInMoveModalSearchBarInput('S-New');
        ResourcesPage.clickResourceListItemInMoveModal('S-New');
        browser.wait(EC.stalenessOf(ResourcesPage.getMoveModal()), delays.ECWaitTime);

        ResourcesPage.getNavigationButtons().then(navigationButtons => {
            expect(navigationButtons.length).toBe(2);
            expect(navigationButtons[0].getText()).toEqual('S1');
            expect(navigationButtons[1].getText()).toEqual('S-New');
        });
    });


    it('navpath - update when moving a resource to another operation', () => {

        ResourcesPage.clickHierarchyButton('S1');
        ResourcesPage.performDescendHierarchy('SE0');
        ResourcesPage.clickOperationNavigationButton();

        ResourcesPage.clickOpenContextMenu('SE0');
        ResourcesPage.clickContextMenuMoveButton();
        ResourcesPage.typeInMoveModalSearchBarInput('S2');
        ResourcesPage.clickResourceListItemInMoveModal('S2');
        browser.wait(EC.stalenessOf(ResourcesPage.getMoveModal()), delays.ECWaitTime);

        ResourcesPage.getNavigationButtons().then(navigationButtons => {
            expect(navigationButtons.length).toBe(1);
            expect(navigationButtons[0].getText()).toEqual('S2');
        });

        NavbarPage.clickTab('project');
        ResourcesPage.clickHierarchyButton('S1');
        ResourcesPage.getNavigationButtons().then(navigationButtons => {
            expect(navigationButtons.length).toBe(1);
            expect(navigationButtons[0].getText()).toEqual('S1');
        });
    });


    it('navpath/hierarchy - switch between modes', () => {

        ResourcesPage.clickHierarchyButton('S1');

        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('SE0'));
        ResourcesPage.performDescendHierarchy('SE0');
        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('testf1'));
        ResourcesPage.clickSwitchHierarchyMode();
        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('SE0'));
        ResourcesPage.getListItemIdentifierText(1).then(text => expect(text).toEqual('testf1'));
    });
});
