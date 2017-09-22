import {browser, protractor} from 'protractor';
import {NavbarPage} from '../navbar.page';
import {ResourcesPage} from '../resources/resources.page';
import {ProjectPage} from '../project.page';
import {DoceditPage} from '../docedit/docedit.page';

const fs = require('fs');
const delays = require('../config/delays');
const EC = protractor.ExpectedConditions;
const common = require('../common');

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('resources/project --', function() {

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

    it('create & switch project', () => {

        performCreateProject();


        // this is a workaround. normally we would like to start on the ProjectPage directly.
        // but then it was shown that for some unkown reasons protractor cannot click to select a resource type
        ResourcesPage.get();
        NavbarPage.clickNavigateToProject();
        //

        browser.sleep(200);

        ResourcesPage.performCreateResource('abc_t1', 'trench');


        NavbarPage.clickNavigateToBuilding();
        NavbarPage.clickNavigateToProject();
        browser.sleep(delays.shortRest);

        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('abc_t1'));

        ProjectPage.clickProjectsBadge();

        ProjectPage.getProjectNameOptionText(1).then(t=>{
            expect(t).toContain('test')
        });
        NavbarPage.clickSelectProject(1);
        ResourcesPage.get();

        browser.sleep(delays.shortRest * 20);

        NavbarPage.clickNavigateToSettings();
        NavbarPage.clickNavigateToExcavation();

        browser.sleep(delays.shortRest * 5);
        ResourcesPage.typeInIdentifierInSearchField('con');
        browser.sleep(delays.shortRest * 5);

        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('context1'));

        ProjectPage.clickProjectsBadge();

        ProjectPage.getProjectNameOptionText(1).then(t=>{
            expect(t).toContain('abc')
        });
        NavbarPage.clickSelectProject(1);
        browser.sleep(delays.shortRest * 10);
        //
        // NavbarPage.clickNavigateToProject();
        // ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('abc_t1'));
    });

    xit('delete project', () => {

        performCreateProject();
        ResourcesPage.get();

        ProjectPage.clickProjectsBadge();
        ProjectPage.getProjectNameOptionText(0).then(t => { expect(t).toContain('abc') });
        ProjectPage.getProjectNameOptionText(1).then(t => { expect(t).toContain('test') });

        ProjectPage.clickDeleteProject();
        browser.sleep(delays.shortRest);

        ProjectPage.typeInProjectName('abc');
        ProjectPage.clickConfirmProjectOperation();

        browser.sleep(delays.shortRest * 10);

        NavbarPage.clickNavigateToProject();
        browser.sleep(delays.shortRest * 15);
        NavbarPage.clickNavigateToExcavation();
        browser.sleep(delays.shortRest * 5);
        ResourcesPage.typeInIdentifierInSearchField('con');
        browser.sleep(delays.shortRest * 5);

        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('context1'));

        ProjectPage.clickProjectsBadge();
        ProjectPage.getProjectNameOptionText(0).then(t => { expect(t).toContain('test') });
    });
});
