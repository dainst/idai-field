import {browser, protractor} from 'protractor';
import {NavbarPage} from '../navbar.page';
import {DocumentViewPage} from '../widgets/document-view.page';
import {SearchBarPage} from '../widgets/search-bar.page';
import {ResourcesPage} from './resources.page';
import {ProjectPage} from '../project.page';
import {MapPage} from '../map/map.page';
import {ImageOverviewPage} from '../images/image-overview.page';

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


    beforeAll(() => {
        ProjectPage.get();
    });


    beforeEach(() => {

        if (index > 0) {
            NavbarPage.performNavigateToSettings();
            require('request').post('http://localhost:3003/reset', {});
            browser.sleep(delays.shortRest * 1.5);
            NavbarPage.clickNavigateToProject();
            browser.sleep(delays.shortRest * 1.5);
        }
        index++;
    });


    beforeAll(() => {
       removeResourcesStateFile();
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
        browser.sleep(delays.shortRest);
        ImageOverviewPage.createDepictsRelation('trench1');
    }

    function clickDepictsRelationLink() {

        ImageOverviewPage.doubleClickCell(0);
        DocumentViewPage.clickRelation(0);
    }

    it('basic stuff', () => {

        ResourcesPage.performCreateResource('trench2', 'trench');

        NavbarPage.clickNavigateToExcavation();

        ResourcesPage.performCreateResource('befund1', 'feature-architecture');

        ResourcesPage.clickSelectMainTypeDocument(1);
        // TODO comment in
        // ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('context1'));
        //
        ResourcesPage.clickSelectMainTypeDocument(0); // trench2
        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('befund1'));

        NavbarPage.clickNavigateToProject();
        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('trench1'));
        ResourcesPage.getListItemIdentifierText(1).then(text => expect(text).toEqual('trench2'));
    });

    it('restore resources state after restarting client', () => {

        ProjectPage.performCreateProject();

        // this is a workaround. normally we would like to start on the ProjectPage directly.
        // but then it was shown that for some unkown reasons protractor cannot click to select a resource type
        ResourcesPage.get();
        NavbarPage.clickNavigateToProject();
        //

        ResourcesPage.performCreateResource('excavation1', 'trench');
        ResourcesPage.performCreateResource('excavation2', 'trench');
        SearchBarPage.clickChooseTypeFilter('building');

        NavbarPage.clickNavigateToExcavation();
        ResourcesPage.clickSelectMainTypeDocument(1);
        ResourcesPage.clickListModeButton();

        ProjectPage.get();
        browser.wait(EC.presenceOf(MapPage.getMapContainer()), delays.ECWaitTime);
        SearchBarPage.getSelectedTypeFilterCharacter().then(value => expect(value).toEqual('B'));

        NavbarPage.clickNavigateToExcavation();
        browser.wait(EC.stalenessOf(MapPage.getMapContainer()), delays.ECWaitTime);
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value[0]).toContain('excavation2'));
    });


    it('switch from image to map view after click on depicts relation link', () => {

        ProjectPage.get();

        createDepictsRelation();
        clickDepictsRelationLink();
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('trench1')), delays.ECWaitTime);
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


    it('switch views after click on relation link', () => {

        ResourcesPage.performCreateResource('building1', 'building');

        NavbarPage.clickNavigateToBuilding();
        ResourcesPage.performCreateResource('architecture1', 'feature-architecture');

        NavbarPage.clickNavigateToExcavation();
        ResourcesPage.performCreateResource('floor1', 'feature-floor');
        ResourcesPage.performCreateRelation('floor1', 'architecture1', 6);

        DocumentViewPage.clickRelation(1);
        NavbarPage.getActiveNavLinkLabel().then(navLinkLabel => expect(navLinkLabel).toEqual('Bauaufnahme'));
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value[0]).toContain('building1'));

        DocumentViewPage.clickRelation(1);
        NavbarPage.getActiveNavLinkLabel().then(navLinkLabel => expect(navLinkLabel).toEqual('Ausgrabung'));
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value[0]).toContain('trench1'));
    });


    it('switch views after click on arrow in project-view list for jumping to mainType-view', () => {
        ResourcesPage.performCreateResource('building1', 'building');
        NavbarPage.clickNavigateToBuilding();
        ResourcesPage.performCreateResource('architecture1', 'feature-architecture');

        NavbarPage.clickNavigateToExcavation();
        ResourcesPage.performCreateResource('floor1', 'feature-floor');

        NavbarPage.clickNavigateToProject();
        ResourcesPage.clickGoToMainTypeViewByIdentifier('building1');
        NavbarPage.getActiveNavLinkLabel().then(navLinkLabel => expect(navLinkLabel).toEqual('Bauaufnahme'));
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value[0]).toContain('building1'));
        
        NavbarPage.clickNavigateToProject();
        ResourcesPage.clickGoToMainTypeViewByIdentifier('trench1');
        NavbarPage.getActiveNavLinkLabel().then(navLinkLabel => expect(navLinkLabel).toEqual('Ausgrabung'));
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value[0]).toContain('trench1'));

        NavbarPage.clickNavigateToProject();
        ResourcesPage.performCreateResource('trench2', 'trench');
        ResourcesPage.clickGoToMainTypeViewByIdentifier('trench2');
        NavbarPage.getActiveNavLinkLabel().then(navLinkLabel => expect(navLinkLabel).toEqual('Ausgrabung'));
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value[0]).toContain('trench2'));
    });


    it('select correct main type document after click on relation link', () => {

        ResourcesPage.performCreateResource('building1', 'building');
        ResourcesPage.performCreateResource('building2', 'building');

        NavbarPage.clickNavigateToBuilding();
        ResourcesPage.clickSelectMainTypeDocument(0); // building2
        ResourcesPage.performCreateResource('architecture1', 'feature-architecture');
        ResourcesPage.clickSelectMainTypeDocument(1); // building1
        ResourcesPage.performCreateResource('floor1', 'feature-floor');
        ResourcesPage.performCreateRelation('floor1', 'architecture1', 6);

        DocumentViewPage.clickRelation(1);
        ResourcesPage.getSelectedListItemIdentifierText().then(text => expect(text).toEqual('architecture1'));
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value[0]).toContain('building1'));

        DocumentViewPage.clickRelation(1);
        ResourcesPage.getSelectedListItemIdentifierText().then(text => expect(text).toEqual('floor1'));
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value[0]).toContain('building2'));
    });


    it('autoselect last selected main type document on switching views', () => {

        ResourcesPage.performCreateResource('trench2', 'trench');
        ResourcesPage.performCreateResource('building1', 'building');
        ResourcesPage.performCreateResource('building2', 'building');

        NavbarPage.clickNavigateToExcavation();
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value[0]).toContain('trench1'));
        ResourcesPage.clickSelectMainTypeDocument(1);
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value[0]).toContain('trench2'));

        NavbarPage.clickNavigateToBuilding();
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value[0]).toContain('building1'));
        ResourcesPage.clickSelectMainTypeDocument(1);
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value[0]).toContain('building2'));

        NavbarPage.clickNavigateToExcavation();
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value[0]).toContain('trench2'));

        NavbarPage.clickNavigateToBuilding();
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value[0]).toContain('building2'));
    });


    it('autoselect last selected type filter on switching views', () => {

        ResourcesPage.performCreateResource('building', 'building');

        NavbarPage.clickNavigateToBuilding();
        ResourcesPage.performCreateResource('building-befund');

        NavbarPage.clickNavigateToExcavation();
        ResourcesPage.performCreateResource('excavation-befund', 'feature-architecture');
        ResourcesPage.performCreateResource('excavation-inschrift', 'feature-floor');

        SearchBarPage.clickChooseTypeFilter('feature-floor');
        SearchBarPage.getSelectedTypeFilterCharacter().then(value => expect(value).toEqual('F'));
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('excavation-befund')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('excavation-inschrift')), delays.ECWaitTime);

        NavbarPage.clickNavigateToBuilding();
        browser.wait(EC.stalenessOf(SearchBarPage.getSelectedTypeFilterButton()), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('building-befund')), delays.ECWaitTime);

        NavbarPage.clickNavigateToExcavation();
        SearchBarPage.getSelectedTypeFilterCharacter().then(value => expect(value).toEqual('F'));
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('excavation-befund')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('excavation-inschrift')), delays.ECWaitTime);
    });


    it('autoselect last selected view mode on switching views', () => {

        ResourcesPage.clickListModeButton();
        browser.wait(EC.stalenessOf(MapPage.getMapContainer()), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListModeInputField('trench1', 0)), delays.ECWaitTime);

        NavbarPage.clickNavigateToExcavation();
        browser.wait(EC.presenceOf(MapPage.getMapContainer()), delays.ECWaitTime);

        NavbarPage.clickNavigateToProject();
        browser.wait(EC.stalenessOf(MapPage.getMapContainer()), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListModeInputField('trench1', 0)), delays.ECWaitTime);
    });


    it('restore search bar input field after switching views', () => {

        SearchBarPage.typeInSearchField('xyz');
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('trench1')), delays.ECWaitTime);

        NavbarPage.clickNavigateToExcavation();
        SearchBarPage.getSearchBarInputFieldValue().then(value => expect(value).toEqual(''));
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('context1')), delays.ECWaitTime);
        SearchBarPage.typeInSearchField('abc');
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('context1')), delays.ECWaitTime);

        NavbarPage.clickNavigateToProject();
        SearchBarPage.getSearchBarInputFieldValue().then(value => expect(value).toEqual('xyz'));
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('trench1')), delays.ECWaitTime);
        SearchBarPage.typeInSearchField(' ');
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('trench1')), delays.ECWaitTime);

        NavbarPage.clickNavigateToExcavation();
        SearchBarPage.getSearchBarInputFieldValue().then(value => expect(value).toEqual('abc'));
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('context1')), delays.ECWaitTime);
    });


    xit('keep query string in search bar input field on switching view modes', () => {

        NavbarPage.clickNavigateToExcavation();
        SearchBarPage.typeInSearchField('testf1');
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('context1')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('testf1')), delays.ECWaitTime);

        ResourcesPage.clickListModeButton();
        SearchBarPage.getSearchBarInputFieldValue().then(value => expect(value).toEqual('testf1'));
        browser.wait(EC.visibilityOf(ResourcesPage.getListItemEl('testf1')), delays.ECWaitTime);

        ResourcesPage.clickMapModeButton();
        SearchBarPage.getSearchBarInputFieldValue().then(value => expect(value).toEqual('testf1'));
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('context1')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('testf1')), delays.ECWaitTime);

        SearchBarPage.typeInSearchField(' ');
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('context1')), delays.ECWaitTime);

        ResourcesPage.clickListModeButton();
        SearchBarPage.getSearchBarInputFieldValue().then(value => expect(value).toEqual(' '));
        browser.wait(EC.invisibilityOf(ResourcesPage.getListItemEl('testf1')), delays.ECWaitTime);
    });


    it('keep type filter on switching view modes', () => {

        NavbarPage.clickNavigateToExcavation();
        SearchBarPage.clickChooseTypeFilter('feature');
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('testf1')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('context1')), delays.ECWaitTime);

        ResourcesPage.clickListModeButton();
        SearchBarPage.getSelectedTypeFilterCharacter().then(value => expect(value).toEqual('S'));
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('testf1')), delays.ECWaitTime);
        browser.wait(EC.visibilityOf(ResourcesPage.getListItemEl('context1')), delays.ECWaitTime);

        ResourcesPage.clickMapModeButton();
        SearchBarPage.getSelectedTypeFilterCharacter().then(value => expect(value).toEqual('S'));
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('testf1')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('context1')), delays.ECWaitTime);

        SearchBarPage.clickChooseTypeFilter('all');
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('testf1')), delays.ECWaitTime);

        ResourcesPage.clickListModeButton();
        browser.wait(EC.stalenessOf(SearchBarPage.getSelectedTypeFilterButton()), delays.ECWaitTime);
        browser.wait(EC.invisibilityOf(ResourcesPage.getListItemEl('testf1')), delays.ECWaitTime);
    });
});
