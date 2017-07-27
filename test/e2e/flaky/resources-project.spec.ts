import {NavbarPage} from '../navbar.page';
import {DocumentViewPage} from '../widgets/document-view.page';
import {ResourcesPage} from '../resources/resources.page';
const fs = require('fs');
import {ProjectPage} from '../project.page';
import {browser, protractor, element, by} from 'protractor';

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

    beforeEach(done => {
        resetConfigJson().then(done);
    });

    afterEach(done => {
        resetConfigJson().then(done);
    });

    fit ('create, switch project', () => {

        browser.sleep(2000);

        ProjectPage.clickCreateProject();
        ProjectPage.typeInProjectName('abc');
        ProjectPage.clickConfirmProjectOperation();

        browser.sleep(2000);

        ResourcesPage.performCreateResource('abc_t1', 0);
        NavbarPage.clickNavigateToExcavation();

        NavbarPage.clickNavigateToProject();
        element.all(by.css('#projectSelectBox option')).get(1).getText().then(t=>{
            expect(t).toContain('test')
        });
        NavbarPage.clickSelectProject(1);
        NavbarPage.clickNavigateToSettings();
        NavbarPage.clickNavigateToExcavation();
        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('context1'));

        NavbarPage.clickNavigateToProject();
        element.all(by.css('#projectSelectBox option')).get(1).getText().then(t=>{
            expect(t).toContain('abc')
        });
        NavbarPage.clickSelectProject(1);

        NavbarPage.clickNavigateToSettings();
        NavbarPage.clickNavigateToProject();

        ResourcesPage.getListItemIdentifierText(0).then(text => {
            console.log("debug",text)
        });

        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('abc_t1'));
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
});
