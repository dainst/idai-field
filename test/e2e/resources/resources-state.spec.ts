import {browser, protractor} from 'protractor';
import {NavbarPage} from '../navbar.page';
import {SearchBarPage} from '../widgets/search-bar.page';
import {ResourcesPage} from './resources.page';
import {ImageOverviewPage} from '../images/image-overview.page';
import {DoceditPage} from '../docedit/docedit.page';
import {DoceditRelationsTabPage} from '../docedit/docedit-relations-tab.page';
import {RelationsViewPage} from '../widgets/relations-view.page';
import {DetailSidebarPage} from '../widgets/detail-sidebar.page';
import {OperationBarPage} from '../operation-bar.page';
import {ResourcesSearchBarPage} from './resources-search-bar.page';

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
            NavbarPage.clickNavigateToOverview();
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

        NavbarPage.clickNavigateToImages();
        browser.sleep(delays.shortRest * 5);
        ImageOverviewPage.createDepictsRelation('S1');
    }


    function clickDepictsRelationLink() {

        ImageOverviewPage.doubleClickCell(0);
        RelationsViewPage.clickRelation(0);
    }


    it('switch from image to map view after click on depicts relation link', () => {

        createDepictsRelation();
        clickDepictsRelationLink();
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('S1')), delays.ECWaitTime);
    });


    it('search/list -- perform a fulltext search', () => {

        NavbarPage.clickNavigateToExcavation();
        ResourcesPage.clickListModeButton();

        OperationBarPage.performSelectOperation(1);

        browser.wait(EC.visibilityOf(ResourcesPage.getListItemEl('SE2')), delays.ECWaitTime);
        SearchBarPage.typeInSearchField('SE1');
        browser.wait(EC.invisibilityOf(ResourcesPage.getListItemEl('SE2')), delays.ECWaitTime);
    });


    it('search/list -- perform a type filter search', () => {

        NavbarPage.clickNavigateToExcavation();
        ResourcesPage.clickListModeButton();

        OperationBarPage.performSelectOperation(1);

        browser.wait(EC.visibilityOf(ResourcesPage.getListItemEl('SE2')), delays.ECWaitTime);
        SearchBarPage.clickChooseTypeFilter('feature-architecture');
        browser.wait(EC.invisibilityOf(ResourcesPage.getListItemEl('SE2')), delays.ECWaitTime);
    });


    it('search -- select all filter', () => {

        NavbarPage.clickNavigateToExcavation();

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

        NavbarPage.clickNavigateToExcavation();

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

        NavbarPage.clickNavigateToExcavation();
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

        NavbarPage.clickNavigateToExcavation();
        browser.sleep(delays.shortRest * 3);

        ResourcesPage.performCreateResource('1', 'feature-architecture');
        ResourcesPage.performCreateResource('2', 'inscription');
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('1')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('2')), delays.ECWaitTime);
        SearchBarPage.clickChooseTypeFilter('feature');
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('2')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('1')), delays.ECWaitTime);
    });


    it('search/suggestions -- show suggestion for extended search query', done => {

        OperationBarPage.clickSwitchHierarchyMode();

        ResourcesPage.openEditByDoubleClickResource('SE2');
        DoceditPage.clickSelectOption('layerClassification', 1);
        DoceditPage.clickSaveDocument();

        NavbarPage.clickNavigateToExcavation();
        OperationBarPage.clickSwitchHierarchyMode();

        SearchBarPage.clickChooseTypeFilter('feature-layer');
        ResourcesSearchBarPage.clickConstraintsMenuButton();
        ResourcesSearchBarPage.clickSelectConstraintField('layerClassification');
        ResourcesSearchBarPage.clickSelectDropdownValue(1);
        ResourcesSearchBarPage.clickAddConstraintButton();
        SearchBarPage.clickSearchBarInputField();

        browser.wait(EC.presenceOf(ResourcesSearchBarPage.getSuggestionsBox()), delays.ECWaitTime);
        ResourcesSearchBarPage.getSuggestions().then(suggestions => {
            expect(suggestions.length).toBe(1);
            expect(suggestions[0].getText()).toEqual('SE2');
        });

        done();
    });


    it('search/extended -- perform constraint search for simple input field', () => {

        OperationBarPage.clickSwitchHierarchyMode();

        ResourcesPage.openEditByDoubleClickResource('S1');
        DoceditPage.typeInInputField('processor', 'testvalue');
        DoceditPage.clickSaveDocument();

        SearchBarPage.clickChooseTypeFilter('operation');
        ResourcesSearchBarPage.clickConstraintsMenuButton();
        ResourcesSearchBarPage.clickSelectConstraintField('processor');
        ResourcesSearchBarPage.typeInConstraintSearchTerm('testvalue');
        ResourcesSearchBarPage.clickAddConstraintButton();

        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('S1')));
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('S2')));
    });


    it('search/extended -- perform constraint search for dropdown field', () => {

        OperationBarPage.clickSwitchHierarchyMode();

        ResourcesPage.openEditByDoubleClickResource('SE2');
        DoceditPage.clickSelectOption('layerClassification', 1);
        DoceditPage.clickSaveDocument();

        SearchBarPage.clickChooseTypeFilter('feature-layer');
        ResourcesSearchBarPage.clickConstraintsMenuButton();
        ResourcesSearchBarPage.clickSelectConstraintField('layerClassification');
        ResourcesSearchBarPage.clickSelectDropdownValue(1);
        ResourcesSearchBarPage.clickAddConstraintButton();

        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('SE2')));
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('SE5')));
    });


    it('search/extended -- perform constraint search for boolean field', () => {

        OperationBarPage.clickSwitchHierarchyMode();

        ResourcesPage.openEditByDoubleClickResource('SE0');
        DoceditPage.clickBooleanRadioButton('hasDisturbance', 0);
        DoceditPage.clickSaveDocument();
        ResourcesPage.openEditByDoubleClickResource('SE1');
        DoceditPage.clickBooleanRadioButton('hasDisturbance', 1);
        DoceditPage.clickSaveDocument();

        SearchBarPage.clickChooseTypeFilter('feature');
        ResourcesSearchBarPage.clickConstraintsMenuButton();
        ResourcesSearchBarPage.clickSelectConstraintField('hasDisturbance');
        ResourcesSearchBarPage.clickSelectBooleanValue(true);
        ResourcesSearchBarPage.clickAddConstraintButton();

        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('SE0')));
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('SE1')));

        ResourcesSearchBarPage.clickRemoveConstraintButton('hasDisturbance');

        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('SE0')));
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('SE1')));

        ResourcesSearchBarPage.clickSelectConstraintField('hasDisturbance');
        ResourcesSearchBarPage.clickSelectBooleanValue(false);
        ResourcesSearchBarPage.clickAddConstraintButton();

        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('SE0')));
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('SE1')));
    });


    it('search/extended -- remove field from dropdown after adding constraint', () => {

        OperationBarPage.clickSwitchHierarchyMode();

        SearchBarPage.clickChooseTypeFilter('operation');
        ResourcesSearchBarPage.clickConstraintsMenuButton();
        ResourcesSearchBarPage.clickSelectConstraintField('processor');

        ResourcesSearchBarPage.typeInConstraintSearchTerm('testvalue');
        ResourcesSearchBarPage.clickAddConstraintButton();

        browser.wait(EC.stalenessOf(
            ResourcesSearchBarPage.getConstraintFieldOption('processor')
        ));
    });


    it('search/suggestions -- show suggestion for resource from different context', done => {

        SearchBarPage.typeInSearchField('SE0');
        browser.sleep(delays.shortRest);
        browser.wait(EC.presenceOf(ResourcesSearchBarPage.getSuggestionsBox()), delays.ECWaitTime);
        ResourcesSearchBarPage.getSuggestions().then(suggestions => {
            expect(suggestions.length).toBe(1);
            expect(suggestions[0].getText()).toEqual('SE0');
        });

        done();
    });


    it('search/suggestions -- do not show suggestions if any resources in current context are found', done => {

        SearchBarPage.typeInSearchField('S');
        browser.sleep(delays.shortRest);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('S1')), delays.ECWaitTime);
        browser.wait(EC.invisibilityOf(ResourcesSearchBarPage.getSuggestionsBox()), delays.ECWaitTime);
        ResourcesSearchBarPage.getSuggestions().then(suggestions => expect(suggestions.length).toBe(0));

        done();
    });


    it('search/suggestions -- do not suggest project document', done => {

        SearchBarPage.typeInSearchField('te');
        browser.sleep(delays.shortRest);
        browser.wait(EC.presenceOf(ResourcesSearchBarPage.getSuggestionsBox()), delays.ECWaitTime);
        ResourcesSearchBarPage.getSuggestions().then(suggestions => {
            expect(suggestions.length).toBe(1);
            expect(suggestions[0].getText()).toEqual('testf1');
        });

        done();
    });


    it('search/suggestions -- delete query string after following suggestion link', async done => {

        SearchBarPage.typeInSearchField('SE0');
        browser.sleep(delays.shortRest);
        browser.wait(EC.presenceOf(ResourcesSearchBarPage.getSuggestionsBox()), delays.ECWaitTime);
        ResourcesSearchBarPage.clickFirstSuggestion();

        NavbarPage.clickNavigateToOverview();
        expect(await SearchBarPage.getSearchBarInputFieldValue()).toEqual('');

        done();
    });


    it('operate in different views', () => {

        ResourcesPage.performCreateResource('trench3', 'trench');

        NavbarPage.clickNavigateToExcavation();

        ResourcesPage.performCreateResource('befund1', 'feature-architecture');

        OperationBarPage.performSelectOperation(1);

        OperationBarPage.performSelectOperation(0); // trench2
        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('befund1'));

        NavbarPage.clickNavigateToOverview();
        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('A1'));
        ResourcesPage.getListItemIdentifierText(1).then(text => expect(text).toEqual('B1'));
        ResourcesPage.getListItemIdentifierText(2).then(text => expect(text).toEqual('S1'));
        ResourcesPage.getListItemIdentifierText(3).then(text => expect(text).toEqual('S2'));
        ResourcesPage.getListItemIdentifierText(4).then(text => expect(text).toEqual('trench3'));
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


    it('jump from operation overview to view via move into button', () => {

        NavbarPage.clickNavigateToExcavation();

        NavbarPage.clickNavigateToOverview();
        ResourcesPage.performCreateResource('t2', 'trench');
        ResourcesPage.clickHierarchyButton('t2');
        NavbarPage.getActiveNavLinkLabel().then(navLinkLabel => expect(navLinkLabel).toEqual('Ausgrabung'));
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value).toContain('t2'));
    });


    it('navpath -- show correct navigation path after click on relation link', () => {

        NavbarPage.clickNavigateToExcavation();

        ResourcesPage.performCreateResource('c2', 'feature');
        ResourcesPage.clickHierarchyButton('c2');
        ResourcesPage.performCreateResource('i1', 'inscription');
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

        NavbarPage.clickNavigateToExcavation();

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

        NavbarPage.clickNavigateToExcavation();

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

        NavbarPage.clickNavigateToExcavation();

        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('SE0'));
        ResourcesPage.clickHierarchyButton('SE0');
        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('testf1'));
        OperationBarPage.clickSwitchHierarchyMode();
        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('SE0'));
        ResourcesPage.getListItemIdentifierText(1).then(text => expect(text).toEqual('testf1'));
    });


    it('navpath/hierarchy - select all', () => {

        NavbarPage.clickNavigateToExcavation();
        OperationBarPage.clickSwitchHierarchyMode();
        OperationBarPage.performSelectOperation(0);
        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('SE0'));
        ResourcesPage.getListItemIdentifierText(1).then(text => expect(text).toEqual('SE1'));
    });
});
