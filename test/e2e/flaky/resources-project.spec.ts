import {NavbarPage} from '../navbar.page';
import {DocumentViewPage} from '../widgets/document-view.page';
import {ResourcesPage} from '../resources/resources.page';
const fs = require('fs');
import {ProjectPage} from '../project.page';
import {browser, protractor, element, by} from 'protractor';
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


    function performCreatProject() {
        ProjectPage.clickCreateProject();
        ProjectPage.typeInProjectName('abc');
        ProjectPage.clickConfirmProjectOperation();
    }

    it('create, switch project', () => {
        performCreatProject();

        ResourcesPage.performCreateResource('abc_t1', 0);
        NavbarPage.clickNavigateToExcavation();

        NavbarPage.clickNavigateToProject();
        ProjectPage.getProjectNameOptionText(1).then(t=>{
            expect(t).toContain('test')
        });
        NavbarPage.clickSelectProject(1);
        NavbarPage.clickNavigateToSettings();
        NavbarPage.clickNavigateToExcavation();
        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('context1'));

        NavbarPage.clickNavigateToProject();
        ProjectPage.getProjectNameOptionText(1).then(t=>{
            expect(t).toContain('abc')
        });
        NavbarPage.clickSelectProject(1);

        NavbarPage.clickNavigateToSettings();
        NavbarPage.clickNavigateToProject();

        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('abc_t1'));
    });

    it ('delete project', () => {
        performCreatProject();

        NavbarPage.clickNavigateToSettings();
        NavbarPage.clickNavigateToProject();
        browser.sleep(200);

        ProjectPage.getProjectNameOptionText(0).then(t => { expect(t).toContain('abc') });
        ProjectPage.getProjectNameOptionText(1).then(t => { expect(t).toContain('test') });

        ProjectPage.clickDeleteProject();
        ProjectPage.typeInProjectName('abc');
        ProjectPage.clickConfirmProjectOperation();
        browser.sleep(200);

        ProjectPage.getProjectNameOptionText(0).then(t => { expect(t).toContain('test') });

        NavbarPage.clickNavigateToSettings();
        NavbarPage.clickNavigateToExcavation();
        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('context1'));
    });
});
