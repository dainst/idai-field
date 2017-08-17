import {browser, protractor} from 'protractor';
import {NavbarPage} from '../navbar.page';
import {DocumentViewPage} from '../widgets/document-view.page';
import {ResourcesPage} from './resources.page';
import {ProjectPage} from '../project.page';
import {MapPage} from './map/map.page';

const fs = require('fs');
const delays = require('../config/delays');
const EC = protractor.ExpectedConditions;

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('resources/project --', function() {

    beforeEach(function() {
        return ProjectPage.get();
    });

    // TODO remove duplicate code with resources syncing spec
    const configPath = browser.params.configPath;
    const configTemplate = browser.params.configTemplate;

    function resetConfigJson(): Promise<any> {

        return new Promise(resolve => {
            fs.writeFile(configPath, JSON.stringify(configTemplate), err => {
                if (err) console.error('Failure while resetting config.json', err);
                resolve();
            });
        });
    }

    afterEach(done => {
        resetConfigJson().then(done);
    });

    function performCreateProject() {
        browser.sleep(delays.shortRest * 10);
        ProjectPage.clickCreateProject();
        ProjectPage.typeInProjectName('abc');
        ProjectPage.clickConfirmProjectOperation();
        browser.sleep(delays.shortRest);
    }

    it('basic stuff', () => {

        ResourcesPage.performCreateResource('trench2', 0);

        NavbarPage.clickNavigateToExcavation();

        ResourcesPage.performCreateResource('befund1', 0);

        ResourcesPage.clickSelectMainType(1);
        // TODO comment in
        // ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('context1'));
        //
        ResourcesPage.clickSelectMainType(0); // trench2
        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('befund1'));

        NavbarPage.clickNavigateToProject();
        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('trench2'));
        ResourcesPage.getListItemIdentifierText(1).then(text => expect(text).toEqual('trench1'));
    });

    it ('delete project', () => {

        performCreateProject();
        browser.sleep(delays.shortRest * 10);

        ProjectPage.getProjectNameOptionText(0).then(t => { expect(t).toContain('abc') });
        ProjectPage.getProjectNameOptionText(1).then(t => { expect(t).toContain('test') });

        ProjectPage.clickDeleteProject();
        browser.sleep(delays.shortRest);

        ProjectPage.typeInProjectName('abc');
        ProjectPage.clickConfirmProjectOperation();

        browser.sleep(delays.shortRest * 10);
        ProjectPage.getProjectNameOptionText(0).then(t => { expect(t).toContain('test') });

        NavbarPage.clickNavigateToBuilding();
        browser.sleep(delays.shortRest * 15);
        NavbarPage.clickNavigateToExcavation();
        browser.sleep(delays.shortRest * 5);
        ResourcesPage.typeInIdentifierInSearchField('con');
        browser.sleep(delays.shortRest * 5);

        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('context1'));
    });

    it('create & switch project', () => {

        performCreateProject();

        ResourcesPage.performCreateResource('abc_t1', 0);
        NavbarPage.clickNavigateToBuilding();
        NavbarPage.clickNavigateToProject();
        browser.sleep(delays.shortRest);

        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('abc_t1'));

        NavbarPage.clickNavigateToProject();
        ProjectPage.getProjectNameOptionText(1).then(t=>{
            expect(t).toContain('test')
        });
        NavbarPage.clickSelectProject(1);
        NavbarPage.clickNavigateToSettings();

        NavbarPage.clickNavigateToExcavation();

        browser.sleep(delays.shortRest * 5);
        ResourcesPage.typeInIdentifierInSearchField('con');
        browser.sleep(delays.shortRest * 5);

        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('context1'));

        NavbarPage.clickNavigateToSettings();
        NavbarPage.clickNavigateToProject();
        ProjectPage.getProjectNameOptionText(1).then(t=>{
            expect(t).toContain('abc')
        });
        NavbarPage.clickSelectProject(1);
        browser.sleep(delays.shortRest * 10);

        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('abc_t1'));
    });

    it('switch views after click on relation link', () => {

        ResourcesPage.performCreateResource('building1', 1);

        NavbarPage.clickNavigateToBuilding();
        ResourcesPage.performCreateResource('befund1', 0);

        NavbarPage.clickNavigateToExcavation();
        ResourcesPage.performCreateResource('fund1', 1);
        ResourcesPage.performCreateRelation('fund1', 'befund1', 0);

        DocumentViewPage.clickRelation(0);
        NavbarPage.getActiveNavLinkLabel().then(navLinkLabel => expect(navLinkLabel).toEqual('Bauforschung'));
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value[0]).toContain('building1'));

        DocumentViewPage.clickRelation(0);
        NavbarPage.getActiveNavLinkLabel().then(navLinkLabel => expect(navLinkLabel).toEqual('Ausgrabung'));
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value[0]).toContain('trench1'));
    });

    it('select correct main type document after click on relation link', () => {

        ResourcesPage.performCreateResource('building1', 1);
        ResourcesPage.performCreateResource('building2', 1);

        NavbarPage.clickNavigateToBuilding();
        ResourcesPage.clickSelectMainType(0); // building2
        ResourcesPage.performCreateResource('befund1', 0);
        ResourcesPage.clickSelectMainType(1); // building1
        ResourcesPage.performCreateResource('fund1', 1);
        ResourcesPage.performCreateRelation('fund1', 'befund1', 0);

        DocumentViewPage.clickRelation(0);
        ResourcesPage.getSelectedListItemIdentifierText().then(text => expect(text).toEqual('befund1'));
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value[0]).toContain('building2'));

        DocumentViewPage.clickRelation(0);
        ResourcesPage.getSelectedListItemIdentifierText().then(text => expect(text).toEqual('fund1'));
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value[0]).toContain('building1'));
    });

    it ('do not delete last project', () => {

        ProjectPage.clickDeleteProject();
        ProjectPage.typeInProjectName('test');
        ProjectPage.clickConfirmProjectOperation();

        expect(NavbarPage.getMessageText()).toContain('vorhanden sein');
    });

    it('do not create a project of an already existing name', () => {

        ProjectPage.clickCreateProject();
        ProjectPage.typeInProjectName('test');
        ProjectPage.clickConfirmProjectOperation();

        expect(NavbarPage.getMessageText()).toContain('existiert bereits');
    });

    it('autoselect last selected main type document on switching views', () => {

        ResourcesPage.performCreateResource('trench2', 0);
        ResourcesPage.performCreateResource('building1', 1);
        ResourcesPage.performCreateResource('building2', 1);

        NavbarPage.clickNavigateToExcavation();
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value[0]).toContain('trench2'));
        ResourcesPage.clickSelectMainType(1);
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value[0]).toContain('trench1'));

        NavbarPage.clickNavigateToBuilding();
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value[0]).toContain('building2'));
        ResourcesPage.clickSelectMainType(1);
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value[0]).toContain('building1'));

        NavbarPage.clickNavigateToExcavation();
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value[0]).toContain('trench1'));

        NavbarPage.clickNavigateToBuilding();
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value[0]).toContain('building1'));
    });

    it('autoselect last selected type filter on switching views', () => {

        ResourcesPage.performCreateResource('building', 1);

        NavbarPage.clickNavigateToBuilding();
        ResourcesPage.performCreateResource('building-befund');

        NavbarPage.clickNavigateToExcavation();
        ResourcesPage.performCreateResource('excavation-befund', 0);
        ResourcesPage.performCreateResource('excavation-fund', 1);

        ResourcesPage.clickChooseTypeFilter(1);
        browser.wait(EC.presenceOf(ResourcesPage.getSelectedTypeFilterButton()), delays.ECWaitTime);
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('excavation-befund')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('excavation-fund')), delays.ECWaitTime);

        NavbarPage.clickNavigateToBuilding();
        browser.wait(EC.stalenessOf(ResourcesPage.getSelectedTypeFilterButton()), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('building-befund')), delays.ECWaitTime);

        NavbarPage.clickNavigateToExcavation();
        browser.wait(EC.presenceOf(ResourcesPage.getSelectedTypeFilterButton()), delays.ECWaitTime);
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('excavation-befund')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('excavation-fund')), delays.ECWaitTime);
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
});
