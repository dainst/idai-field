import {browser, protractor} from 'protractor';
import {NavbarPage} from '../navbar.page';
import {ResourcesPage} from '../resources/resources.page';
import {ProjectPage} from '../project.page';
import {MapPage} from '../resources/map/map.page';

const fs = require('fs');
const delays = require('../config/delays');
const EC = protractor.ExpectedConditions;

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
        browser.sleep(delays.shortRest * 20);
    }

    function removeResourcesStateFile() {

        const filePath = appDataPath + '/resources-state-' + 'abc.json';
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    it('create & switch project', () => {

        performCreateProject();

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

        NavbarPage.clickNavigateToProject();
        ResourcesPage.getListItemIdentifierText(0).then(text => expect(text).toEqual('abc_t1'));
    });

    it('delete project', () => {

        performCreateProject();

        ProjectPage.clickProjectsBadge();
        ProjectPage.getProjectNameOptionText(0).then(t => { expect(t).toContain('abc') });
        ProjectPage.getProjectNameOptionText(1).then(t => { expect(t).toContain('test') });

        ProjectPage.clickDeleteProject();
        browser.sleep(delays.shortRest);

        ProjectPage.typeInProjectName('abc');
        ProjectPage.clickConfirmProjectOperation();

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

    it('restore resources state after restarting client', () => {

        performCreateProject();

        ResourcesPage.performCreateResource('excavation1', 0);
        ResourcesPage.performCreateResource('excavation2', 0);
        ResourcesPage.clickChooseTypeFilter(1);

        NavbarPage.clickNavigateToExcavation();
        ResourcesPage.clickSelectMainTypeDocument(1);
        ResourcesPage.clickListModeButton();

        ProjectPage.get();
        browser.wait(EC.presenceOf(MapPage.getMapContainer()), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getSelectedTypeFilterButton()), delays.ECWaitTime);

        NavbarPage.clickNavigateToExcavation();
        browser.wait(EC.stalenessOf(MapPage.getMapContainer()), delays.ECWaitTime);
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value[0]).toContain('excavation1'));
    });
});
