import {browser, protractor} from 'protractor';
import {NavbarPage} from '../navbar.page';
import {ResourcesPage} from '../resources/resources.page';
import {ProjectPage} from './project.page';
import {SearchBarPage} from '../widgets/search-bar.page';

const fs = require('fs');
const EC = protractor.ExpectedConditions;
const delays = require('../config/delays');
const common = require('../common');


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('project --', function() {

    const appDataPath = browser.params.appDataPath;


    beforeAll(() => {

       removeResourcesStateFile();
    });


    beforeEach(() => {

        return ResourcesPage.get('project');
    });


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


    it('delete project', () => {

        performCreateProject();
        ResourcesPage.get();

        ProjectPage.clickProjectsBadge();
        ProjectPage.getProjectNameOptionText(0).then(text => { expect(text).toContain('abc') });
        ProjectPage.getProjectNameOptionText(1).then(text => { expect(text).toContain('test') });

        ProjectPage.clickDeleteProject();
        browser.sleep(delays.shortRest);

        ProjectPage.typeInProjectName('abc');
        ProjectPage.clickConfirmProjectOperation();
        browser.sleep(1000);

        ResourcesPage.get();
        browser.sleep(delays.shortRest * 15);
        ResourcesPage.clickHierarchyButton('S1');
        browser.sleep(delays.shortRest * 5);
        SearchBarPage.typeInSearchField('SE');

        browser.wait(EC.visibilityOf(ResourcesPage.getListItemEl('SE0')), delays.ECWaitTime);

        ProjectPage.clickProjectsBadge();
        ProjectPage.getProjectNameOptionText(0).then(t => { expect(t).toContain('test') });
    });


    it('create & switch project', () => {

        performCreateProject();

        // this is a workaround. normally we would like to start on the ProjectPage directly.
        // but then it was shown that for some unknown reasons protractor cannot click to select a resource type
        ResourcesPage.get();
        NavbarPage.navigate('images');
        browser.sleep(200);
        NavbarPage.navigate('project');
        //

        browser.sleep(200);

        ResourcesPage.performCreateResource('abc_t1', 'trench');
        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('abc_t1'));

        ProjectPage.clickProjectsBadge();

        ProjectPage.getProjectNameOptionText(1).then(text => expect(text).toContain('test'));
        NavbarPage.clickSelectProject(1);
        ResourcesPage.get();

        browser.sleep(delays.shortRest * 20);

        NavbarPage.performNavigateToSettings();
        NavbarPage.navigate('project');
        ResourcesPage.clickHierarchyButton('S1');

        browser.sleep(delays.shortRest * 5);
        SearchBarPage.typeInSearchField('SE');
        browser.sleep(delays.shortRest * 5);

        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('SE0'));

        ProjectPage.clickProjectsBadge();

        ProjectPage.getProjectNameOptionText(1).then(text => expect(text).toContain('abc'));
        NavbarPage.clickSelectProject(1);

        ResourcesPage.get();
        browser.sleep(delays.shortRest * 10);
        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('abc_t1'));
    });
});
