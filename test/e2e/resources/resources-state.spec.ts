import {browser, protractor} from 'protractor';
import {NavbarPage} from '../navbar.page';
import {SearchBarPage} from '../widgets/search-bar.page';
import {ResourcesPage} from './resources.page';
import {ImageOverviewPage} from '../images/image-overview.page';
import {DoceditPage} from '../docedit/docedit.page';
import {DoceditRelationsTabPage} from '../docedit/docedit-relations-tab.page';
import {RelationsViewPage} from '../widgets/relations-view.page';
import {DetailSidebarPage} from '../widgets/detail-sidebar.page';
import {ResourcesSearchBarPage} from './resources-search-bar.page';
import {SearchConstraintsPage} from '../widgets/search-constraints.page';

const fs = require('fs');
const delays = require('../config/delays');
const EC = protractor.ExpectedConditions;
const common = require('../common');

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('resources/state --', function() {

    const appDataPath = browser.params.appDataPath;

    let index = 0;


    beforeAll(() => ResourcesPage.get('project'));

    beforeAll(() => removeResourcesStateFile());


    beforeEach(async done => {

        if (index > 0) {
            NavbarPage.performNavigateToSettings();
            await common.resetApp();
            browser.sleep(delays.shortRest);
            NavbarPage.navigate('project');
            browser.sleep(delays.shortRest * 3);
        }

        index++;
        done();
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

        NavbarPage.navigate('images');
        browser.sleep(delays.shortRest * 5);
        ImageOverviewPage.createDepictsRelation('S1');
    }


    function clickDepictsRelationLink() {

        ImageOverviewPage.doubleClickCell(0);
        RelationsViewPage.clickRelation(0);
    }


    it('search/suggestions -- show suggestion for resource from different context', done => {

        SearchBarPage.typeInSearchField('SE0');
        browser.wait(EC.presenceOf(ResourcesSearchBarPage.getSuggestionsBox()), delays.ECWaitTime);
        ResourcesSearchBarPage.getSuggestions().then(suggestions => {
            expect(suggestions.length).toBe(1);
            expect(suggestions[0].getText()).toEqual('SE0');
        });

        done();
    });


    it('search/suggestions -- do not show suggestions if any resources in current context are found', done => {

        SearchBarPage.typeInSearchField('S');
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('S1')), delays.ECWaitTime);
        browser.wait(EC.invisibilityOf(ResourcesSearchBarPage.getSuggestionsBox()), delays.ECWaitTime);
        ResourcesSearchBarPage.getSuggestions().then(suggestions => expect(suggestions.length).toBe(0));

        done();
    });


    it('search/suggestions -- do not suggest project document', done => {

        SearchBarPage.typeInSearchField('te');
        browser.wait(EC.presenceOf(ResourcesSearchBarPage.getSuggestionsBox()), delays.ECWaitTime);
        ResourcesSearchBarPage.getSuggestions().then(suggestions => {
            expect(suggestions.length).toBe(1);
            expect(suggestions[0].getText()).toEqual('testf1');
        });

        done();
    });


    it('search/suggestions -- delete query string after following suggestion link', async done => {

        SearchBarPage.typeInSearchField('SE0');
        browser.wait(EC.presenceOf(ResourcesSearchBarPage.getSuggestionsBox()), delays.ECWaitTime);
        ResourcesSearchBarPage.clickFirstSuggestion();

        NavbarPage.navigate('project');
        expect(await SearchBarPage.getSearchBarInputFieldValue()).toEqual('');

        done();
    });


    it('search/list -- perform a fulltext search', () => {

        ResourcesPage.clickHierarchyButton('S2');
        ResourcesPage.clickListModeButton();

        browser.wait(EC.visibilityOf(ResourcesPage.getListItemEl('SE2')), delays.ECWaitTime);
        SearchBarPage.typeInSearchField('SE1');
        browser.wait(EC.invisibilityOf(ResourcesPage.getListItemEl('SE2')), delays.ECWaitTime);
    });


    it('search/list -- perform a type filter search', () => {

        ResourcesPage.clickHierarchyButton('S2');
        ResourcesPage.clickListModeButton();

        browser.wait(EC.visibilityOf(ResourcesPage.getListItemEl('SE2')), delays.ECWaitTime);
        SearchBarPage.clickChooseTypeFilter('feature-architecture');
        browser.wait(EC.invisibilityOf(ResourcesPage.getListItemEl('SE2')), delays.ECWaitTime);
    });


    it('search -- select all filter', () => {

        ResourcesPage.clickHierarchyButton('S1');

        ResourcesPage.performCreateResource('1', 'feature-architecture');
        ResourcesPage.performCreateResource('2', 'feature-floor');
        SearchBarPage.clickChooseTypeFilter('inscription');
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('1')), delays.ECWaitTime);
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('2')), delays.ECWaitTime);
        SearchBarPage.clickChooseTypeFilter('all');
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('1')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('2')), delays.ECWaitTime);
    });


    it('search -- show correct types in plus type menu after choosing type filter', () => {

        ResourcesPage.clickHierarchyButton('S1');

        const checkTypeOptions = () => {

            SearchBarPage.clickChooseTypeFilter('feature');
            ResourcesPage.clickCreateResource();
            browser.wait(EC.presenceOf(ResourcesPage.getResourceTypeOption('feature')), delays.ECWaitTime);
            browser.wait(EC.presenceOf(ResourcesPage.getResourceTypeOption('feature-architecture')), delays.ECWaitTime);
            browser.wait(EC.stalenessOf(ResourcesPage.getResourceTypeOption('find')), delays.ECWaitTime);
            browser.wait(EC.stalenessOf(ResourcesPage.getResourceTypeOption('find-pottery')), delays.ECWaitTime);

            SearchBarPage.clickChooseTypeFilter('find');
            ResourcesPage.clickCreateResource();
            browser.wait(EC.presenceOf(ResourcesPage.getResourceTypeOption('find')), delays.ECWaitTime);
            browser.wait(EC.presenceOf(ResourcesPage.getResourceTypeOption('find-pottery')), delays.ECWaitTime);
            browser.wait(EC.stalenessOf(ResourcesPage.getResourceTypeOption('feature')), delays.ECWaitTime);
            browser.wait(EC.stalenessOf(ResourcesPage.getResourceTypeOption('feature-architecture')), delays.ECWaitTime);

            SearchBarPage.clickChooseTypeFilter('all');
            ResourcesPage.clickCreateResource();
            browser.wait(EC.presenceOf(ResourcesPage.getResourceTypeOption('feature')), delays.ECWaitTime);
            browser.wait(EC.presenceOf(ResourcesPage.getResourceTypeOption('feature-architecture')), delays.ECWaitTime);
            browser.wait(EC.presenceOf(ResourcesPage.getResourceTypeOption('find')), delays.ECWaitTime);
            browser.wait(EC.presenceOf(ResourcesPage.getResourceTypeOption('find-pottery')), delays.ECWaitTime);
        };

        checkTypeOptions();
        ResourcesPage.clickListModeButton();
        checkTypeOptions();
    });


    it('search -- set type of newly created resource to filter type if a child type is chosen as filter type', () => {

        ResourcesPage.clickHierarchyButton('S1');
        browser.sleep(delays.shortRest * 3);

        const checkTypeIcon = () => {

            SearchBarPage.clickChooseTypeFilter('feature-architecture');
            ResourcesPage.getCreateDocumentButtonTypeCharacter()
                .then(character => expect(character).toEqual('A'));

            SearchBarPage.clickChooseTypeFilter('feature');
            browser.wait(EC.stalenessOf(ResourcesPage.getCreateDocumentButtonTypeIcon()), delays.ECWaitTime);

            SearchBarPage.clickChooseTypeFilter('all');
            browser.wait(EC.stalenessOf(ResourcesPage.getCreateDocumentButtonTypeIcon()), delays.ECWaitTime);
        };

        const createResourceWithPresetType = (identifier: string, listMode: boolean) => {

            SearchBarPage.clickChooseTypeFilter('feature-layer');
            ResourcesPage.getCreateDocumentButtonTypeCharacter()
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

        checkTypeIcon();
        createResourceWithPresetType('1', false);
        DetailSidebarPage.getTypeFromDocView().then(character => expect(character).toEqual('Erdbefund'));

        ResourcesPage.clickListModeButton();
        checkTypeIcon();
        createResourceWithPresetType('2', true);
    });


    it('search -- filter by parent type', () => {

        ResourcesPage.clickHierarchyButton('S1');
        browser.sleep(delays.shortRest * 3);

        ResourcesPage.performCreateResource('1', 'feature-architecture');
        ResourcesPage.performCreateResource('2', 'inscription',
            undefined, undefined, true);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('1')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('2')), delays.ECWaitTime);
        SearchBarPage.clickChooseTypeFilter('feature');
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('2')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('1')), delays.ECWaitTime);
    });


    it('search/suggestions -- show suggestion for extended search query', done => {

        ResourcesPage.clickSwitchHierarchyMode();

        ResourcesPage.openEditByDoubleClickResource('SE2');
        DoceditPage.clickSelectOption('layerClassification', 1);
        DoceditPage.clickSaveDocument();

        ResourcesPage.clickSwitchHierarchyMode();
        ResourcesPage.clickHierarchyButton('S1');
        ResourcesPage.clickSwitchHierarchyMode();

        SearchBarPage.clickChooseTypeFilter('feature-layer');
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


    it('search/extended -- perform constraint search for simple input field', () => {

        ResourcesPage.clickSwitchHierarchyMode();

        ResourcesPage.openEditByDoubleClickResource('S1');
        DoceditPage.typeInInputField('processor', 'testvalue');
        DoceditPage.clickSaveDocument();

        SearchBarPage.clickChooseTypeFilter('operation');
        SearchConstraintsPage.clickConstraintsMenuButton();
        SearchConstraintsPage.clickSelectConstraintField('processor');
        SearchConstraintsPage.typeInConstraintSearchTerm('testvalue');
        SearchConstraintsPage.clickAddConstraintButton();

        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('S1')));
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('S2')));
    });


    it('search/extended -- perform constraint search for dropdown field', () => {

        ResourcesPage.clickSwitchHierarchyMode();

        ResourcesPage.openEditByDoubleClickResource('SE2');
        DoceditPage.clickSelectOption('layerClassification', 1);
        DoceditPage.clickSaveDocument();

        SearchBarPage.clickChooseTypeFilter('feature-layer');
        SearchConstraintsPage.clickConstraintsMenuButton();
        SearchConstraintsPage.clickSelectConstraintField('layerClassification');
        SearchConstraintsPage.clickSelectDropdownValue(1);
        SearchConstraintsPage.clickAddConstraintButton();

        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('SE2')));
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('SE5')));
    });


    it('search/extended -- perform constraint search for boolean field', () => {

        ResourcesPage.clickSwitchHierarchyMode();

        ResourcesPage.openEditByDoubleClickResource('SE0');
        DoceditPage.clickBooleanRadioButton('hasDisturbance', 0);
        DoceditPage.clickSaveDocument();
        ResourcesPage.openEditByDoubleClickResource('SE1');
        DoceditPage.clickBooleanRadioButton('hasDisturbance', 1);
        DoceditPage.clickSaveDocument();

        SearchBarPage.clickChooseTypeFilter('feature');
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


    it('search/extended -- remove field from dropdown after adding constraint', () => {

        ResourcesPage.clickSwitchHierarchyMode();

        SearchBarPage.clickChooseTypeFilter('operation');
        SearchConstraintsPage.clickConstraintsMenuButton();
        SearchConstraintsPage.clickSelectConstraintField('processor');

        SearchConstraintsPage.typeInConstraintSearchTerm('testvalue');
        SearchConstraintsPage.clickAddConstraintButton();

        browser.wait(EC.stalenessOf(
            SearchConstraintsPage.getConstraintFieldOption('processor')
        ));
    });


    it('switch from image to map view after click on depicts relation link', () => {

        createDepictsRelation();
        clickDepictsRelationLink();
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('S1')), delays.ECWaitTime);
    });


    it('invalidate filter (if necessary) when switching from image to map view after click on depicts relation link', () => {

        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('S1')), delays.ECWaitTime);
        SearchBarPage.clickChooseTypeFilter('place');
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
        ResourcesPage.clickHierarchyButton('c2');
        ResourcesPage.performCreateResource('i1', 'inscription',
            undefined, undefined, true);
        ResourcesPage.performCreateRelation('i1', 'testf1', 0);

        RelationsViewPage.clickRelation(2);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('testf1')), delays.ECWaitTime);
        ResourcesPage.getSelectedListItemIdentifierText().then(text => expect(text).toEqual('testf1'));
        ResourcesPage.getNavigationButtons().then(navigationButtons => {
            expect(navigationButtons.length).toBe(2);
            expect(navigationButtons[0].getText()).toEqual('S1');
            expect(navigationButtons[1].getText()).toEqual('SE0');
        });
    });


    it('navpath -- update navigation path after changing liesWithin relation', () => {

        ResourcesPage.clickHierarchyButton('S1');

        ResourcesPage.performCreateResource('context2', 'feature');
        ResourcesPage.clickHierarchyButton('SE0');

        ResourcesPage.openEditByDoubleClickResource('testf1');
        DoceditPage.clickRelationsTab();
        DoceditRelationsTabPage.clickRelationDeleteButtonByIndices(1, 0);
        DoceditRelationsTabPage.clickAddRelationForGroupWithIndex(1);
        DoceditRelationsTabPage.typeInRelationByIndices(1, 0, 'context2');
        DoceditRelationsTabPage.clickChooseRelationSuggestion(1, 0, 0);
        DoceditPage.clickSaveDocument();

        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('testf1')), delays.ECWaitTime);
        ResourcesPage.getNavigationButtons().then(navigationButtons => {
            expect(navigationButtons.length).toBe(2);
            expect(navigationButtons[0].getText()).toEqual('S1');
            expect(navigationButtons[1].getText()).toEqual('context2');
        });
    });


    it('navpath -- update navigation path after deleting resource', () => {

        ResourcesPage.clickHierarchyButton('S1');
        ResourcesPage.clickHierarchyButton('SE0');
        ResourcesPage.clickMainTypeDocumentNavigationButton();

        ResourcesPage.openEditByDoubleClickResource('SE0');
        DoceditPage.clickDeleteDocument();
        DoceditPage.typeInIdentifierInConfirmDeletionInputField('SE0');
        DoceditPage.clickConfirmDeleteInModal();

        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('SE0')), delays.ECWaitTime);
        ResourcesPage.getNavigationButtons().then(navigationButtons => {
            expect(navigationButtons.length).toBe(1);
            expect(navigationButtons[0].getText()).toEqual('S1');
        });
    });


    it('navpath/hierarchy - switch between modes', () => {

        ResourcesPage.clickHierarchyButton('S1');

        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('SE0'));
        ResourcesPage.clickHierarchyButton('SE0');
        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('testf1'));
        ResourcesPage.clickSwitchHierarchyMode();
        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('SE0'));
        ResourcesPage.getListItemIdentifierText(1).then(text => expect(text).toEqual('testf1'));
    });
});
