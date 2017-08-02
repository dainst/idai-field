import {browser} from 'protractor';
import {NavbarPage} from '../navbar.page';
import {DocumentViewPage} from '../widgets/document-view.page';
import {ResourcesPage} from './resources.page';
const fs = require('fs');
import {ProjectPage} from '../project.page';
const delays = require('../config/delays');

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

    it('switchProject views after click on relation link', () => {
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

    it('do not create with the same name', () => {

        ProjectPage.clickCreateProject();
        ProjectPage.typeInProjectName('test');
        ProjectPage.clickConfirmProjectOperation();

        expect(NavbarPage.getMessageText()).toContain('existiert bereits');
    });

    function performCreateProject() {
        browser.sleep(delays.shortRest * 10);
        ProjectPage.clickCreateProject();
        ProjectPage.typeInProjectName('abc');
        ProjectPage.clickConfirmProjectOperation();
        browser.sleep(delays.shortRest);
    }

    it('create, switchProject project', () => {
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
        NavbarPage.clickNavigateToImages();

        NavbarPage.clickNavigateToExcavation();

        browser.sleep(delays.shortRest * 5);
        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('context1'));

        NavbarPage.clickNavigateToProject();
        ProjectPage.getProjectNameOptionText(1).then(t=>{
            expect(t).toContain('abc')
        });
        NavbarPage.clickSelectProject(1);
        browser.sleep(delays.shortRest * 10);

        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('abc_t1'));
    });
});
