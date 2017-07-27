import {browser} from 'protractor';
import {NavbarPage} from '../navbar.page';
import {DocumentViewPage} from '../widgets/document-view.page';
import {ResourcesPage} from './resources.page';
const fs = require('fs');
import {ProjectPage} from '../project.page';

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

    it ('delete project', () => {

        NavbarPage.clickNavigateToExcavation();
        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('context1'));

        NavbarPage.clickNavigateToProject();
        ProjectPage.clickCreateProject();
        ProjectPage.typeInProjectName('abc');
        ProjectPage.clickConfirmProjectOperation();

        browser.sleep(1000);

        ProjectPage.clickDeleteProject();
        ProjectPage.typeInProjectName('abc');
        ProjectPage.clickConfirmProjectOperation();

        browser.sleep(100);

        expect(NavbarPage.getMessageText()).toContain('wurde gelöscht');

        // browser.sleep(2000);
        //
        // NavbarPage.clickNavigateToSettings();
        // NavbarPage.clickNavigateToExcavation();
        // ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('context1'));
    });

    it('basic stuff', () => {
        ResourcesPage.performCreateResource('trench2', 0);

        NavbarPage.clickNavigateToExcavation();

        ResourcesPage.clickSelectMainType(1);
        ResourcesPage.performCreateResource('befund1', 0);

        ResourcesPage.clickSelectMainType(0);
        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('context1'));

        ResourcesPage.clickSelectMainType(1);
        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('befund1'));

        NavbarPage.clickNavigateToProject();
        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('trench1'));
        ResourcesPage.getListItemIdentifierText(1).then(text => expect(text).toEqual('trench2'));
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
        ResourcesPage.clickSelectMainType(0);
        ResourcesPage.performCreateResource('befund1', 0);
        ResourcesPage.clickSelectMainType(1);
        ResourcesPage.performCreateResource('fund1', 1);
        ResourcesPage.performCreateRelation('fund1', 'befund1', 0);

        DocumentViewPage.clickRelation(0);
        ResourcesPage.getSelectedListItemIdentifierText().then(text => expect(text).toEqual('befund1'));
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value[0]).toContain('building1'));

        DocumentViewPage.clickRelation(0);
        ResourcesPage.getSelectedListItemIdentifierText().then(text => expect(text).toEqual('fund1'));
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value[0]).toContain('building2'));
    });

    xit ('create, switch project', () => {

        ProjectPage.clickCreateProject();
        ProjectPage.typeInProjectName('abc');
        ProjectPage.clickConfirmProjectOperation();

        ResourcesPage.performCreateResource('abc_t1', 0);
        NavbarPage.clickNavigateToExcavation();

        NavbarPage.clickNavigateToProject();
        NavbarPage.clickSelectProject(1);
        NavbarPage.clickNavigateToSettings();
        NavbarPage.clickNavigateToExcavation();
        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('context1'));

        NavbarPage.clickNavigateToProject();
        NavbarPage.clickSelectProject(1);
        NavbarPage.clickNavigateToSettings();
        NavbarPage.clickNavigateToProject();
        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('abc_t1'));
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
});
