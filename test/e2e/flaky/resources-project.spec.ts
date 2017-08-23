import {browser} from 'protractor';
import {NavbarPage} from '../navbar.page';
import {ResourcesPage} from '../resources/resources.page';
import {ProjectPage} from '../project.page';

const fs = require('fs');
const delays = require('../config/delays');

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

    // TODO remove duplicate code with resources syncing spec
    const configPath = browser.params.configPath;
    const configTemplate = browser.params.configTemplate;
    const appDataPath = browser.params.appDataPath;

    function resetConfigJson(): Promise<any> {

        return new Promise(resolve => {
            fs.writeFile(configPath, JSON.stringify(configTemplate), err => {
                if (err) console.error('Failure while resetting config.json', err);
                resolve();
            });
        });
    }

    afterEach(done => {

        removeResourcesStateFile();
        resetConfigJson().then(done);
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

        browser.refresh();

        ResourcesPage.performCreateResource('abc_t1', 0);
        NavbarPage.clickNavigateToBuilding();
        NavbarPage.clickNavigateToProject();
        browser.sleep(delays.shortRest);

        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('abc_t1'));

        ProjectPage.clickProjectsBadge();

        ProjectPage.getProjectNameOptionText(1).then(t=>{
            expect(t).toContain('test')
        });
        NavbarPage.clickSelectProject(1);

        browser.refresh();

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

        NavbarPage.clickNavigateToProject();
        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('abc_t1'));
    });

    it('delete project', () => {

        performCreateProject();

        browser.refresh();

        ProjectPage.clickProjectsBadge();
        ProjectPage.getProjectNameOptionText(0).then(t => { expect(t).toContain('abc') });
        ProjectPage.getProjectNameOptionText(1).then(t => { expect(t).toContain('test') });

        ProjectPage.clickDeleteProject();
        browser.sleep(delays.shortRest);

        ProjectPage.typeInProjectName('abc');
        ProjectPage.clickConfirmProjectOperation();

        browser.refresh();

        browser.sleep(delays.shortRest * 10);

        NavbarPage.clickNavigateToBuilding();
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
