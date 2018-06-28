import {browser, protractor} from 'protractor';
import {NavbarPage} from '../navbar.page';
import {SearchBarPage} from '../widgets/search-bar.page';
import {ResourcesPage} from './resources.page';
import {ProjectPage} from '../project.page';
import {MapPage} from '../map/map.page';
import {ImageOverviewPage} from '../images/image-overview.page';
import {DoceditPage} from '../docedit/docedit.page';
import {DoceditRelationsTabPage} from '../docedit/docedit-relations-tab.page';
import {RelationsViewPage} from '../widgets/relations-view.page';
import {DetailSidebarPage} from '../widgets/detail-sidebar.page';
import {TaskbarPage} from '../taskbar.page';

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

    beforeAll(() => ProjectPage.get());

    beforeAll(() => removeResourcesStateFile());


    beforeEach(() => {

        if (index > 0) {
            NavbarPage.performNavigateToSettings().then(() => {
                require('request').post('http://localhost:3003/reset', {});
            });
            browser.sleep(delays.shortRest);
            NavbarPage.clickNavigateToProject();
            browser.sleep(delays.shortRest * 3);
        }
        index++;
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
        ImageOverviewPage.createDepictsRelation('trench1');
    }


    function clickDepictsRelationLink() {

        ImageOverviewPage.doubleClickCell(0);
        RelationsViewPage.clickRelation(0);
    }


    it('switch from image to map view after click on depicts relation link', () => {

        createDepictsRelation();
        clickDepictsRelationLink();
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('trench1')), delays.ECWaitTime);
    });


    it('search/list -- perform a fulltext search', () => {

        NavbarPage.clickNavigateToExcavation();
        ResourcesPage.clickListModeButton();

        ResourcesPage.performCreateResourceInList('context2', 'feature');

        SearchBarPage.typeInSearchField('SI0');
        browser.wait(EC.invisibilityOf(ResourcesPage.getListItemEl('context2')), delays.ECWaitTime);
        browser.wait(EC.visibilityOf(ResourcesPage.getListItemEl('SI0')), delays.ECWaitTime);

        SearchBarPage.typeInSearchField('context2');
        browser.wait(EC.invisibilityOf(ResourcesPage.getListItemEl('SI0')), delays.ECWaitTime);
        browser.wait(EC.visibilityOf(ResourcesPage.getListItemEl('context2')), delays.ECWaitTime);

        SearchBarPage.typeInSearchField('abc');
        browser.wait(EC.invisibilityOf(ResourcesPage.getListItemEl('SI0')), delays.ECWaitTime);
        browser.wait(EC.invisibilityOf(ResourcesPage.getListItemEl('context2')), delays.ECWaitTime);
    });


    it('search/list -- perform a type filter search', () => {

        NavbarPage.clickNavigateToExcavation();
        ResourcesPage.clickListModeButton();

        ResourcesPage.performCreateResourceInList('testf2', 'find');

        SearchBarPage.clickChooseTypeFilter('find');
        browser.wait(EC.invisibilityOf(ResourcesPage.getListItemEl('SI0')), delays.ECWaitTime);
        browser.wait(EC.visibilityOf(ResourcesPage.getListItemEl('testf2')), delays.ECWaitTime);

        SearchBarPage.clickChooseTypeFilter('processunit');
        browser.wait(EC.invisibilityOf(ResourcesPage.getListItemEl('testf2')), delays.ECWaitTime);
        browser.wait(EC.invisibilityOf(ResourcesPage.getListItemEl('SI0')), delays.ECWaitTime);
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


    it('search -- show only resources of the selected type', () => {

        NavbarPage.clickNavigateToExcavation();

        ResourcesPage.performCreateResource('1', 'feature-architecture');
        ResourcesPage.performCreateResource('2', 'feature-floor');
        SearchBarPage.clickChooseTypeFilter('feature-floor');
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('1')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('2')), delays.ECWaitTime);
        SearchBarPage.clickChooseTypeFilter('feature-architecture');
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('1')), delays.ECWaitTime);
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('2')), delays.ECWaitTime);
    });


    it('search -- show correct types in plus type menu after choosing type filter', () => {

        NavbarPage.clickNavigateToExcavation();

        const checkTypeOptions = () => {

            SearchBarPage.clickChooseTypeFilter('feature');
            ResourcesPage.clickCreateResource();
            browser.wait(EC.presenceOf(ResourcesPage.getResourceTypeOption('feature')), delays.ECWaitTime);
            browser.wait(EC.presenceOf(ResourcesPage.getResourceTypeOption('feature-architecture')), delays.ECWaitTime);
            browser.wait(EC.stalenessOf(ResourcesPage.getResourceTypeOption('inscription')), delays.ECWaitTime);
            browser.wait(EC.stalenessOf(ResourcesPage.getResourceTypeOption('processunit')), delays.ECWaitTime);
            browser.wait(EC.stalenessOf(ResourcesPage.getResourceTypeOption('processunit-drilling')), delays.ECWaitTime);
            browser.wait(EC.stalenessOf(ResourcesPage.getResourceTypeOption('wall_surface')), delays.ECWaitTime);
            browser.wait(EC.stalenessOf(ResourcesPage.getResourceTypeOption('find')), delays.ECWaitTime);
            browser.wait(EC.stalenessOf(ResourcesPage.getResourceTypeOption('find-glass')), delays.ECWaitTime);

            SearchBarPage.clickChooseTypeFilter('processunit');
            ResourcesPage.clickCreateResource();
            browser.wait(EC.presenceOf(ResourcesPage.getResourceTypeOption('processunit')), delays.ECWaitTime);
            browser.wait(EC.presenceOf(ResourcesPage.getResourceTypeOption('processunit-drilling')), delays.ECWaitTime);
            browser.wait(EC.stalenessOf(ResourcesPage.getResourceTypeOption('feature')), delays.ECWaitTime);
            browser.wait(EC.stalenessOf(ResourcesPage.getResourceTypeOption('feature-architecture')), delays.ECWaitTime);
            browser.wait(EC.stalenessOf(ResourcesPage.getResourceTypeOption('inscription')), delays.ECWaitTime);
            browser.wait(EC.stalenessOf(ResourcesPage.getResourceTypeOption('wall_surface')), delays.ECWaitTime);
            browser.wait(EC.stalenessOf(ResourcesPage.getResourceTypeOption('find')), delays.ECWaitTime);
            browser.wait(EC.stalenessOf(ResourcesPage.getResourceTypeOption('find-glass')), delays.ECWaitTime);

            SearchBarPage.clickChooseTypeFilter('all');
            ResourcesPage.clickCreateResource();
            browser.wait(EC.presenceOf(ResourcesPage.getResourceTypeOption('feature')), delays.ECWaitTime);
            browser.wait(EC.presenceOf(ResourcesPage.getResourceTypeOption('feature-architecture')), delays.ECWaitTime);
            browser.wait(EC.presenceOf(ResourcesPage.getResourceTypeOption('inscription')), delays.ECWaitTime);
            browser.wait(EC.presenceOf(ResourcesPage.getResourceTypeOption('processunit')), delays.ECWaitTime);
            browser.wait(EC.presenceOf(ResourcesPage.getResourceTypeOption('processunit-drilling')), delays.ECWaitTime);
            browser.wait(EC.presenceOf(ResourcesPage.getResourceTypeOption('wall_surface')), delays.ECWaitTime);
            browser.wait(EC.presenceOf(ResourcesPage.getResourceTypeOption('find')), delays.ECWaitTime);
            browser.wait(EC.presenceOf(ResourcesPage.getResourceTypeOption('find-glass')), delays.ECWaitTime);
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
            ResourcesPage.getCreateDocumentButtonTypeCharacter().then(character => expect(character).toEqual('A'));

            SearchBarPage.clickChooseTypeFilter('feature');
            browser.wait(EC.stalenessOf(ResourcesPage.getCreateDocumentButtonTypeIcon()), delays.ECWaitTime);

            SearchBarPage.clickChooseTypeFilter('all');
            browser.wait(EC.stalenessOf(ResourcesPage.getCreateDocumentButtonTypeIcon()), delays.ECWaitTime);
        };

        const createResourceWithPresetType = (identifier: string, selectGeometryType: boolean) => {

            SearchBarPage.clickChooseTypeFilter('feature-layer');
            ResourcesPage.getCreateDocumentButtonTypeCharacter().then(character => expect(character).toEqual('E'));
            ResourcesPage.clickCreateResource();
            if (selectGeometryType) ResourcesPage.clickSelectGeometryType();

            ResourcesPage.isListMode().then(function(isListMode) {
                if (isListMode) {
                    ResourcesPage.typeInNewResourceAndHitEnterInList(identifier);
                } else {
                    DoceditPage.typeInInputField('identifier', identifier);
                    ResourcesPage.scrollUp();
                    DoceditPage.clickSaveDocument();
                }
            });

            browser.sleep(delays.shortRest);
        };

        checkTypeIcon();
        createResourceWithPresetType('1', true);
        DetailSidebarPage.getTypeFromDocView().then(character => expect(character).toEqual('Erdbefund'));

        ResourcesPage.clickListModeButton();
        checkTypeIcon();
        createResourceWithPresetType('2', false);
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


    it('search/suggestions -- show suggestion for resource from different context', done => {

        SearchBarPage.typeInSearchField('c');
        browser.wait(EC.presenceOf(ResourcesPage.getSuggestionsBox()), delays.ECWaitTime);
        ResourcesPage.getSuggestions().then(suggestions => {
            expect(suggestions.length).toBe(1);
            expect(suggestions[0].getText()).toEqual('SI0');
        });

        done();
    });


    it('search/suggestion -- do not show suggestions if any resources in current context are found', done => {

        SearchBarPage.typeInSearchField('t');
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('trench1')), delays.ECWaitTime);
        browser.wait(EC.invisibilityOf(ResourcesPage.getSuggestionsBox()), delays.ECWaitTime);
        ResourcesPage.getSuggestions().then(suggestions => expect(suggestions.length).toBe(0));

        done();
    });


    it('search/suggestions -- do not suggest project document', done => {

        SearchBarPage.typeInSearchField('te');
        browser.wait(EC.presenceOf(ResourcesPage.getSuggestionsBox()), delays.ECWaitTime);
        ResourcesPage.getSuggestions().then(suggestions => {
            expect(suggestions.length).toBe(1);
            expect(suggestions[0].getText()).toEqual('testf1');
        });

        done();
    });


    it('basic stuff', () => {

        ResourcesPage.performCreateResource('trench3', 'trench');

        NavbarPage.clickNavigateToExcavation();

        ResourcesPage.performCreateResource('befund1', 'feature-architecture');

        TaskbarPage.performSelectOperation(1);

        TaskbarPage.performSelectOperation(0); // trench2
        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('befund1'));

        NavbarPage.clickNavigateToProject();
        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('trench1'));
        ResourcesPage.getListItemIdentifierText(1).then(text => expect(text).toEqual('trench2'));
        ResourcesPage.getListItemIdentifierText(2).then(text => expect(text).toEqual('trench3'));
    });


    it('invalidate filter (if necessary) when switching from image to map view after click on depicts relation link', () => {

        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('trench1')), delays.ECWaitTime);
        SearchBarPage.clickChooseTypeFilter('place');
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('trench1')), delays.ECWaitTime);

        createDepictsRelation();
        clickDepictsRelationLink();
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('trench1')), delays.ECWaitTime);
    });


    it('invalidate query string (if necessary) when switching from image to map view after click on depicts relation link', () => {

        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('trench1')), delays.ECWaitTime);
        SearchBarPage.typeInSearchField('xyz');
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('trench1')), delays.ECWaitTime);

        createDepictsRelation();
        clickDepictsRelationLink();
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('trench1')), delays.ECWaitTime);
        SearchBarPage.getSearchBarInputFieldValue().then(value => expect(value).toEqual(''));
    });


    it('switch views after click on arrow in project-view list for jumping to mainType-view', () => {

        ResourcesPage.performCreateResource('b1', 'building');
        NavbarPage.clickNavigateToBuilding();
        ResourcesPage.performCreateResource('a1', 'feature-architecture');

        NavbarPage.clickNavigateToExcavation();
        ResourcesPage.performCreateResource('f1', 'feature-floor');

        NavbarPage.clickNavigateToProject();
        ResourcesPage.clickMoveIntoButton('b1');
        NavbarPage.getActiveNavLinkLabel().then(navLinkLabel => expect(navLinkLabel).toEqual('Bauaufnahmen'));
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value).toContain('b1'));
        
        NavbarPage.clickNavigateToProject();
        ResourcesPage.clickMoveIntoButton('trench1');
        NavbarPage.getActiveNavLinkLabel().then(navLinkLabel => expect(navLinkLabel).toEqual('Schnitte'));
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value).toContain('trench1'));
        //
        NavbarPage.clickNavigateToProject();
        ResourcesPage.performCreateResource('t2', 'trench');
        ResourcesPage.clickMoveIntoButton('t2');
        NavbarPage.getActiveNavLinkLabel().then(navLinkLabel => expect(navLinkLabel).toEqual('Schnitte'));
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value).toContain('t2'));
    });


    // xitted because currently there is no relation which allows to jump between views
    xit('select correct main type document after click on relation link', () => {

        ResourcesPage.performCreateResource('b1', 'building');
        ResourcesPage.performCreateResource('b2', 'building');

        NavbarPage.clickNavigateToBuilding();
        TaskbarPage.performSelectOperation(0); // building2
        ResourcesPage.performCreateResource('a1', 'feature-architecture');
        TaskbarPage.performSelectOperation(1); // building1
        ResourcesPage.performCreateResource('f1', 'feature-floor');
        ResourcesPage.performCreateRelation('f1', 'a1', 5);

        RelationsViewPage.clickRelation(0);
        ResourcesPage.getSelectedListItemIdentifierText().then(text => expect(text).toEqual('a1'));
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value).toContain('b1'));

        RelationsViewPage.clickRelation(0);
        ResourcesPage.getSelectedListItemIdentifierText().then(text => expect(text).toEqual('f1'));
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value).toContain('b2'));
    });


    it('navpath -- show correct navigation path after click on relation link', () => {

        NavbarPage.clickNavigateToExcavation();

        ResourcesPage.performCreateResource('c2', 'feature');
        ResourcesPage.clickMoveIntoButton('c2');
        ResourcesPage.performCreateResource('i1', 'inscription');
        ResourcesPage.performCreateRelation('i1', 'testf1', 1);

        RelationsViewPage.clickRelation(0);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('testf1')), delays.ECWaitTime);
        ResourcesPage.getSelectedListItemIdentifierText().then(text => expect(text).toEqual('testf1'));
        ResourcesPage.getNavigationButtons().then(navigationButtons => {
            expect(navigationButtons.length).toBe(2);
            expect(navigationButtons[0].getText()).toEqual('trench1');
            expect(navigationButtons[1].getText()).toEqual('SI0');
        });
    });


    it('navpath -- update navigation path after changing liesWithin relation', () => {

        NavbarPage.clickNavigateToExcavation();

        ResourcesPage.performCreateResource('context2', 'feature');
        ResourcesPage.clickMoveIntoButton('SI0');

        ResourcesPage.openEditByDoubleClickResource('testf1');
        DoceditPage.clickRelationsTab();
        DoceditRelationsTabPage.clickRelationDeleteButtonByIndices(0, 0, 0);
        DoceditRelationsTabPage.clickAddRelationForGroupWithIndex(0);
        DoceditRelationsTabPage.typeInRelationByIndices(0, 0, 'context2');
        DoceditRelationsTabPage.clickChooseRelationSuggestion(0, 0, 0);
        DoceditPage.clickSaveDocument();

        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('testf1')), delays.ECWaitTime);
        ResourcesPage.getNavigationButtons().then(navigationButtons => {
            expect(navigationButtons.length).toBe(2);
            expect(navigationButtons[0].getText()).toEqual('trench1');
            expect(navigationButtons[1].getText()).toEqual('context2');
        });
    });


    it('navpath -- update navigation path after deleting resource', () => {

        NavbarPage.clickNavigateToExcavation();

        ResourcesPage.clickMoveIntoButton('SI0');
        ResourcesPage.clickMainTypeDocumentNavigationButton();

        ResourcesPage.openEditByDoubleClickResource('SI0');
        DoceditPage.clickDeleteDocument();
        DoceditPage.typeInIdentifierInConfirmDeletionInputField('SI0');
        DoceditPage.clickConfirmDeleteInModal();

        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('SI0')), delays.ECWaitTime);
        ResourcesPage.getNavigationButtons().then(navigationButtons => {
            expect(navigationButtons.length).toBe(1);
            expect(navigationButtons[0].getText()).toEqual('trench1');
        });
    });


    it('navpath/hierarchy - switch between modes', () => {

        NavbarPage.clickNavigateToExcavation();

        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('SI0'));
        ResourcesPage.clickMoveIntoButton('SI0');
        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('testf1'));
        TaskbarPage.clickSwitchHierarchyMode();
        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('SI0'));
        ResourcesPage.getListItemIdentifierText(1).then(text => expect(text).toEqual('testf1'));
    });


    it('navpath/hierarchy - select all ', () => {

        NavbarPage.clickNavigateToExcavation();
        TaskbarPage.clickSwitchHierarchyMode();
        TaskbarPage.performSelectOperation(0);
        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('SI0'));
        ResourcesPage.getListItemIdentifierText(1).then(text => expect(text).toEqual('SI1'));
    });


    it('autoselect last selected main type document on switching views', () => {

        ResourcesPage.performCreateResource('t2', 'trench');
        ResourcesPage.performCreateResource('b1', 'building');
        ResourcesPage.performCreateResource('b2', 'building');

        NavbarPage.clickNavigateToExcavation();
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value).toContain('t2'));
        TaskbarPage.performSelectOperation(1);
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value).toContain('trench1'));

        NavbarPage.clickNavigateToBuilding();
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value).toContain('b1'));
        TaskbarPage.performSelectOperation(1);
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value).toContain('b2'));

        NavbarPage.clickNavigateToExcavation();
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value).toContain('trench1'));

        NavbarPage.clickNavigateToBuilding();
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value).toContain('b2'));
    });


    it('autoselect last selected type filter on switching views', () => {

        ResourcesPage.performCreateResource('building', 'building');

        NavbarPage.clickNavigateToBuilding();
        ResourcesPage.performCreateResource('b-befund');

        NavbarPage.clickNavigateToExcavation();
        ResourcesPage.performCreateResource('e-befund', 'feature-architecture');
        ResourcesPage.performCreateResource('e-inschrift', 'feature-floor');

        SearchBarPage.clickChooseTypeFilter('feature-floor');
        SearchBarPage.getSelectedTypeFilterCharacter().then(value => expect(value).toEqual('F'));
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('e-befund')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('e-inschrift')), delays.ECWaitTime);

        NavbarPage.clickNavigateToBuilding();
        browser.wait(EC.stalenessOf(SearchBarPage.getSelectedTypeFilterButton()), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('b-befund')), delays.ECWaitTime);

        NavbarPage.clickNavigateToExcavation();
        SearchBarPage.getSelectedTypeFilterCharacter().then(value => expect(value).toEqual('F'));
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('e-befund')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('e-inschrift')), delays.ECWaitTime);
    });


    it('keep mode when switching views', () => {

        ResourcesPage.clickListModeButton();
        browser.wait(EC.stalenessOf(MapPage.getMapContainer()), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListModeInputField('trench1', 0)), delays.ECWaitTime);

        NavbarPage.clickNavigateToExcavation();
        browser.wait(EC.presenceOf(ResourcesPage.getListModeInputField('SI0', 0)), delays.ECWaitTime);

        NavbarPage.clickNavigateToProject();
        browser.wait(EC.presenceOf(ResourcesPage.getListModeInputField('trench1', 0)), delays.ECWaitTime);
    });


    it('restore search bar input field after switching views', () => {

        SearchBarPage.typeInSearchField('xyz');
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('trench1')), delays.ECWaitTime);

        NavbarPage.clickNavigateToExcavation();
        SearchBarPage.getSearchBarInputFieldValue().then(value => expect(value).toEqual(''));
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('SI0')), delays.ECWaitTime);
        SearchBarPage.typeInSearchField('abc');
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('SI0')), delays.ECWaitTime);

        NavbarPage.clickNavigateToProject();
        SearchBarPage.getSearchBarInputFieldValue().then(value => expect(value).toEqual('xyz'));
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('trench1')), delays.ECWaitTime);
        SearchBarPage.typeInSearchField(' ');
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('trench1')), delays.ECWaitTime);

        NavbarPage.clickNavigateToExcavation();
        SearchBarPage.getSearchBarInputFieldValue().then(value => expect(value).toEqual('abc'));
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('SI0')), delays.ECWaitTime);
    });


    it('keep query string in search bar input field on switching view modes', () => {

        NavbarPage.clickNavigateToExcavation();
        SearchBarPage.typeInSearchField('context_');
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('SI0')), delays.ECWaitTime);

        ResourcesPage.clickListModeButton();
        SearchBarPage.getSearchBarInputFieldValue().then(value => expect(value).toEqual('context_'));
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('testf1')), delays.ECWaitTime);

        ResourcesPage.clickMapModeButton();
        SearchBarPage.getSearchBarInputFieldValue().then(value => expect(value).toEqual('context_'));
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('SI0')), delays.ECWaitTime);

        SearchBarPage.typeInSearchField(' ');
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('SI0')), delays.ECWaitTime);

        ResourcesPage.clickListModeButton();
        SearchBarPage.getSearchBarInputFieldValue().then(value => expect(value).toEqual(' '));
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('SI0')), delays.ECWaitTime);
    });


    it('keep type filter on switching view modes', () => {

        NavbarPage.clickNavigateToExcavation();
        ResourcesPage.performCreateResource('f2', 'find');

        SearchBarPage.clickChooseTypeFilter('feature');
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('f2')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('SI0')), delays.ECWaitTime);

        ResourcesPage.clickListModeButton();
        SearchBarPage.getSelectedTypeFilterCharacter().then(value => expect(value).toEqual('S'));
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('f2')), delays.ECWaitTime);
        browser.wait(EC.visibilityOf(ResourcesPage.getListItemEl('SI0')), delays.ECWaitTime);

        ResourcesPage.clickMapModeButton();
        SearchBarPage.getSelectedTypeFilterCharacter().then(value => expect(value).toEqual('S'));
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('f2')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('SI0')), delays.ECWaitTime);

        SearchBarPage.clickChooseTypeFilter('all');
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('f2')), delays.ECWaitTime);

        ResourcesPage.clickListModeButton();
        browser.wait(EC.stalenessOf(SearchBarPage.getSelectedTypeFilterButton()), delays.ECWaitTime);
        browser.wait(EC.visibilityOf(ResourcesPage.getListItemEl('f2')), delays.ECWaitTime);
    });


    // xitted because currently there is no relation which allows to jump between views
    xit('switch views after click on relation link', () => {

        ResourcesPage.performCreateResource('b1', 'building');

        NavbarPage.clickNavigateToBuilding();
        ResourcesPage.performCreateResource('a1', 'feature-architecture');

        NavbarPage.clickNavigateToExcavation();
        ResourcesPage.performCreateResource('floor1', 'feature-floor');
        ResourcesPage.performCreateRelation('floor1', 'a1', 5);

        RelationsViewPage.clickRelation(0);
        NavbarPage.getActiveNavLinkLabel().then(navLinkLabel => expect(navLinkLabel).toEqual('Bauaufnahmen'));
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value).toContain('b1'));

        RelationsViewPage.clickRelation(0);
        NavbarPage.getActiveNavLinkLabel().then(navLinkLabel => expect(navLinkLabel).toEqual('Schnitte'));
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value).toContain('trench1'));
    });
});
