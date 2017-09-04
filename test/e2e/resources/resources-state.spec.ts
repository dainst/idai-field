import {browser, protractor} from 'protractor';
import {NavbarPage} from '../navbar.page';
import {DocumentViewPage} from '../widgets/document-view.page';
import {ResourcesPage} from './resources.page';
import {ProjectPage} from '../project.page';
import {MapPage} from '../map/map.page';
import {ImagesGridPage} from "../images/images-grid.page";

const fs = require('fs');
const delays = require('../config/delays');
const EC = protractor.ExpectedConditions;
const common = require('../common');

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('resources/state --', function() {

    beforeAll(() => {
       removeResourcesStateFile();
    });

    beforeEach(() => {
        return ProjectPage.get();
    });

    const appDataPath = browser.params.appDataPath;

    afterEach(done => {

        removeResourcesStateFile();
        common.resetConfigJson().then(done);
    });

    function performCreateProject() {

        browser.sleep(delays.shortRest * 10);
        ProjectPage.clickProjectsBadge();
        ProjectPage.clickCreateProject();
        ProjectPage.typeInProjectName('abc');
        ProjectPage.clickConfirmProjectOperation();
        browser.sleep(delays.shortRest * 10);
    }

    function removeResourcesStateFile() {

        const filePath = appDataPath + '/resources-state-' + 'abc.json';
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    function createDepictsRelation() {

        browser.sleep(1000);
        NavbarPage.clickNavigateToImages();
        browser.sleep(1000);
        ImagesGridPage.createDepictsRelation('trench1');
        browser.sleep(2000);
    }

    function clickDepictsRelationLink() {

        ImagesGridPage.doubleClickCell(0);
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


    it('switch from image to map view after click on depicts relation link', () => {

        createDepictsRelation();
        clickDepictsRelationLink();
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('trench1')), delays.ECWaitTime);
    });

    it('invalidate filter (if necessary) when switching from image to map view after click on depicts relation link', () => {

        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('trench1')), delays.ECWaitTime);
        ResourcesPage.clickChooseTypeFilter('place');
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('trench1')), delays.ECWaitTime); // make sure it disappeared

        createDepictsRelation();
        clickDepictsRelationLink();
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('trench1')), delays.ECWaitTime);
    });

    it('switch views after click on relation link', () => {

        ResourcesPage.performCreateResource('building1', 'building');

        NavbarPage.clickNavigateToBuilding();
        ResourcesPage.performCreateResource('befund1', 'feature-architecture');

        NavbarPage.clickNavigateToExcavation();
        ResourcesPage.performCreateResource('fund1', 'feature-floor');
        ResourcesPage.performCreateRelation('fund1', 'befund1', 0);

        DocumentViewPage.clickRelation(0);
        NavbarPage.getActiveNavLinkLabel().then(navLinkLabel => expect(navLinkLabel).toEqual('Bauaufnahme'));
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value[0]).toContain('building1'));

        DocumentViewPage.clickRelation(0);
        NavbarPage.getActiveNavLinkLabel().then(navLinkLabel => expect(navLinkLabel).toEqual('Ausgrabung'));
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value[0]).toContain('trench1'));
    });

    it('select correct main type document after click on relation link', () => {

        ResourcesPage.performCreateResource('building1', 'building');
        ResourcesPage.performCreateResource('building2', 'building');

        NavbarPage.clickNavigateToBuilding();
        ResourcesPage.clickSelectMainTypeDocument(0); // building2
        ResourcesPage.performCreateResource('befund1', 'feature-architecture');
        ResourcesPage.clickSelectMainTypeDocument(1); // building1
        ResourcesPage.performCreateResource('fund1', 'feature-floor');
        ResourcesPage.performCreateRelation('fund1', 'befund1', 0);

        DocumentViewPage.clickRelation(0);
        ResourcesPage.getSelectedListItemIdentifierText().then(text => expect(text).toEqual('befund1'));
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value[0]).toContain('building1'));

        DocumentViewPage.clickRelation(0);
        ResourcesPage.getSelectedListItemIdentifierText().then(text => expect(text).toEqual('fund1'));
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

        ResourcesPage.clickChooseTypeFilter('feature-floor');
        browser.wait(EC.presenceOf(ResourcesPage.getSelectedTypeFilterButton()), delays.ECWaitTime);
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('excavation-befund')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('excavation-inschrift')), delays.ECWaitTime);

        NavbarPage.clickNavigateToBuilding();
        browser.wait(EC.stalenessOf(ResourcesPage.getSelectedTypeFilterButton()), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('building-befund')), delays.ECWaitTime);

        NavbarPage.clickNavigateToExcavation();
        browser.wait(EC.presenceOf(ResourcesPage.getSelectedTypeFilterButton()), delays.ECWaitTime);
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

    it('clear search bar input field on switching views', () => {

        ResourcesPage.typeInIdentifierInSearchField('xyz');
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('trench1')), delays.ECWaitTime);

        NavbarPage.clickNavigateToExcavation();
        ResourcesPage.getSearchBarInputFieldValue().then(value => expect(value).toEqual(''));
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('context1')), delays.ECWaitTime);

        NavbarPage.clickNavigateToProject();
        ResourcesPage.getSearchBarInputFieldValue().then(value => expect(value).toEqual(''));
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('trench1')), delays.ECWaitTime);
    });

    it('keep query string in search bar input field on switching view modes', () => {

        NavbarPage.clickNavigateToExcavation();
        ResourcesPage.typeInIdentifierInSearchField('testf1');
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('context1')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('testf1')), delays.ECWaitTime);

        ResourcesPage.clickListModeButton();
        ResourcesPage.getSearchBarInputFieldValue().then(value => expect(value).toEqual('testf1'));
        browser.wait(EC.visibilityOf(ResourcesPage.getListItemEl('testf1')), delays.ECWaitTime);

        ResourcesPage.clickMapModeButton();
        ResourcesPage.getSearchBarInputFieldValue().then(value => expect(value).toEqual('testf1'));
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('context1')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('testf1')), delays.ECWaitTime);

        ResourcesPage.typeInIdentifierInSearchField(' ');
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('context1')), delays.ECWaitTime);

        ResourcesPage.clickListModeButton();
        ResourcesPage.getSearchBarInputFieldValue().then(value => expect(value).toEqual(' '));
        browser.wait(EC.invisibilityOf(ResourcesPage.getListItemEl('testf1')), delays.ECWaitTime);
    });

    it('keep type filter on switching view modes', () => {

        NavbarPage.clickNavigateToExcavation();
        ResourcesPage.clickChooseTypeFilter('feature');
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('testf1')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('context1')), delays.ECWaitTime);

        ResourcesPage.clickListModeButton();
        browser.wait(EC.presenceOf(ResourcesPage.getSelectedTypeFilterButton()), delays.ECWaitTime);
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('testf1')), delays.ECWaitTime);
        browser.wait(EC.visibilityOf(ResourcesPage.getListItemEl('context1')), delays.ECWaitTime);

        ResourcesPage.clickMapModeButton();
        browser.wait(EC.presenceOf(ResourcesPage.getSelectedTypeFilterButton()), delays.ECWaitTime);
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('testf1')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('context1')), delays.ECWaitTime);

        ResourcesPage.clickChooseTypeFilter('all');
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('testf1')), delays.ECWaitTime);

        ResourcesPage.clickListModeButton();
        browser.wait(EC.stalenessOf(ResourcesPage.getSelectedTypeFilterButton()), delays.ECWaitTime);
        browser.wait(EC.invisibilityOf(ResourcesPage.getListItemEl('testf1')), delays.ECWaitTime);
    });

    it('restore resources state after restarting client', () => {

        performCreateProject();

        ResourcesPage.performCreateResource('excavation1', 'trench');
        ResourcesPage.performCreateResource('excavation2', 'trench');
        ResourcesPage.clickChooseTypeFilter('building');

        NavbarPage.clickNavigateToExcavation();
        ResourcesPage.clickSelectMainTypeDocument(1);
        ResourcesPage.clickListModeButton();

        ProjectPage.get();
        browser.wait(EC.presenceOf(MapPage.getMapContainer()), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getSelectedTypeFilterButton()), delays.ECWaitTime);

        NavbarPage.clickNavigateToExcavation();
        browser.wait(EC.stalenessOf(MapPage.getMapContainer()), delays.ECWaitTime);
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value[0]).toContain('excavation2'));
    });
});
