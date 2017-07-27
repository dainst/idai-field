import {browser} from 'protractor';
import {NavbarPage} from '../navbar.page';
import {DocumentViewPage} from '../widgets/document-view.page';
import {ResourcesPage} from '../resources/resources.page';
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
        browser.sleep(1000);
        ProjectPage.clickConfirmProjectOperation();
        browser.sleep(1000);
        
        // expect(NavbarPage.getMessageText()).toContain('wurde gelöscht');
        //
        // browser.sleep(2000);
        //
        // NavbarPage.clickNavigateToSettings();
        // NavbarPage.clickNavigateToExcavation();
        // ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('context1'));
    });

    it ('create, switch project', () => {

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
});
