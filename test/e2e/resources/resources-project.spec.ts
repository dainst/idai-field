import {browser} from 'protractor';
import {NavbarPage} from '../navbar.page';
import {ResourcesPage} from './resources.page';
import {ProjectPage} from '../project.page';
import {SearchBarPage} from '../widgets/search-bar.page';

const fs = require('fs');
const delays = require('../config/delays');
const common = require('../common');

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('resources/project --', function() {

    const appDataPath = browser.params.appDataPath;


    beforeAll(() => {
       removeResourcesStateFile();
    });


    beforeEach(() => {
        return ProjectPage.get();
    });


    afterEach(done => {

        removeResourcesStateFile();
        common.resetConfigJson().then(done);
    });


    function performCreateProject() {

        browser.sleep(delays.shortRest );
        ProjectPage.clickProjectsBadge();
        ProjectPage.clickCreateProject();
        ProjectPage.typeInProjectName('abc');
        ProjectPage.clickConfirmProjectOperation();
        browser.sleep(delays.shortRest);
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

        browser.sleep(delays.shortRest);

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

        browser.sleep(delays.shortRest);

        NavbarPage.performNavigateToSettings();
        NavbarPage.clickNavigateToExcavation();

        browser.sleep(delays.shortRest);
        SearchBarPage.typeInSearchField('con');
        browser.sleep(delays.shortRest);

        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('context1'));

        ProjectPage.clickProjectsBadge();

        ProjectPage.getProjectNameOptionText(1).then(t=>{
            expect(t).toContain('abc')
        });
        NavbarPage.clickSelectProject(1);

        ResourcesPage.get();
        NavbarPage.clickNavigateToExcavation();
        browser.sleep(delays.shortRest);

        NavbarPage.clickNavigateToProject();
        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('abc_t1'));
    });


    it('delete project', () => {

        performCreateProject();
        ResourcesPage.get();

        ProjectPage.clickProjectsBadge();
        ProjectPage.getProjectNameOptionText(0).then(t => { expect(t).toContain('abc') });
        ProjectPage.getProjectNameOptionText(1).then(t => { expect(t).toContain('test') });

        ProjectPage.clickDeleteProject();
        browser.sleep(delays.shortRest);

        ProjectPage.typeInProjectName('abc');
        ProjectPage.clickConfirmProjectOperation();
        browser.sleep(delays.shortRest);

        ResourcesPage.get();
        browser.sleep(delays.shortRest);
        NavbarPage.clickNavigateToProject();
        browser.sleep(delays.shortRest);
        NavbarPage.clickNavigateToExcavation();
        browser.sleep(delays.shortRest);
        SearchBarPage.typeInSearchField('con');
        browser.sleep(delays.shortRest);

        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('context1'));

        ProjectPage.clickProjectsBadge();
        ProjectPage.getProjectNameOptionText(0).then(t => { expect(t).toContain('test') });
    });


    it('do not create a project of an already existing name', () => {

        ProjectPage.clickProjectsBadge();
        ProjectPage.clickCreateProject();
        ProjectPage.typeInProjectName('test');
        ProjectPage.clickConfirmProjectOperation();

        expect(NavbarPage.getMessageText()).toContain('existiert bereits');
    });


    it ('do not delete last project', () => {

        ProjectPage.clickProjectsBadge();

        ProjectPage.clickDeleteProject();
        ProjectPage.typeInProjectName('test');
        ProjectPage.clickConfirmProjectOperation();

        expect(NavbarPage.getMessageText()).toContain('vorhanden sein');
    });
});
