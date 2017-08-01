import {NavbarPage} from '../navbar.page';
import {DocumentViewPage} from '../widgets/document-view.page';
import {ResourcesPage} from '../resources/resources.page';
const fs = require('fs');
import {ProjectPage} from '../project.page';
import {browser, protractor, element, by} from 'protractor';
const EC = protractor.ExpectedConditions;
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


    function performCreateProject() {
        browser.sleep(delays.shortRest * 10);
        ProjectPage.clickCreateProject();
        ProjectPage.typeInProjectName('abc');
        ProjectPage.clickConfirmProjectOperation();
        browser.sleep(delays.shortRest);
    }

    xit ('delete project', () => {
        performCreateProject();

        ProjectPage.getProjectNameOptionText(0).then(t => { expect(t).toContain('abc') });
        ProjectPage.getProjectNameOptionText(1).then(t => { expect(t).toContain('test') });

        ProjectPage.clickDeleteProject();
        browser.sleep(delays.shortRest);

        ProjectPage.typeInProjectName('abc');
        ProjectPage.clickConfirmProjectOperation();

        browser.sleep(delays.shortRest);

        ProjectPage.getProjectNameOptionText(0).then(t => { expect(t).toContain('test') });

        NavbarPage.clickNavigateToBuilding();
        browser.sleep(delays.shortRest * 15);
        NavbarPage.clickNavigateToExcavation();
        browser.sleep(delays.shortRest);
        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('context1'));
    });

    function waitForIt(searchTerm, successCB) {

        return browser.sleep(3000).then(() =>
            ResourcesPage.typeInIdentifierInSearchField(searchTerm)
        ).then(() => {
            return browser.wait(EC.visibilityOf(
                element(by.css('#objectList .list-group-item:nth-child(1) .title'))), 500).then(
                () => {
                    return successCB();
                },
                () => {
                    return waitForIt(searchTerm, successCB);
                });
        });
    }

    xit('try reproduce why create switch fails', () => {
        browser.sleep(200);

        // do it in the test project

        ResourcesPage.performCreateResource('abc_t1', 0);
        browser.sleep(delays.shortRest);
        NavbarPage.clickNavigateToBuilding();
        browser.sleep(delays.shortRest);
        NavbarPage.clickNavigateToProject();
        browser.sleep(delays.shortRest);

        // this works, we see the abc_t1 as first list element

        fail("take a picture");
    });

    it('create, switchProject project', done => {
        performCreateProject();

        ResourcesPage.performCreateResource('abc_t1', 0);
        NavbarPage.clickNavigateToBuilding();
        NavbarPage.clickNavigateToProject();

        waitForIt('abc_t1', () => {

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

            waitForIt('abc_t1', () => {
                ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('abc_t1'));
                done();
            });
        });
    });
});
