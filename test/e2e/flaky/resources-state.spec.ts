import {browser, protractor} from 'protractor';
import {NavbarPage} from '../navbar.page';
import {DocumentViewPage} from '../widgets/document-view.page';
import {ResourcesPage} from '../resources/resources.page';
import {ProjectPage} from '../project.page';
import {MapPage} from '../map/map.page';
import {ImagesGridPage} from '../images/images-grid.page';

const fs = require('fs');
const delays = require('../config/delays');
const EC = protractor.ExpectedConditions;
const common = require('../common');

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('resources/state --', function() {

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

    function createDepictsRelation() {

        browser.sleep(1000);
        NavbarPage.clickNavigateToImages();
        browser.sleep(1000);
        ImagesGridPage.createDepictsRelation('trench1');
        browser.sleep(2000);
    }

    function clickDepictsRelationLink() {

        ImagesGridPage.doubleClickCell(0);
        DocumentViewPage.clickRelation(0);
    }

    it('restore resources state after restarting client', () => {

        performCreateProject();

        // this is a workaround. normally we would like to start on the ProjectPage directly.
        // but then it was shown that for some unkown reasons protractor cannot click to select a resource type
        ResourcesPage.get();
        NavbarPage.clickNavigateToProject();
        //

        ResourcesPage.performCreateResource('excavation1', 'trench');
        ResourcesPage.performCreateResource('excavation2', 'trench');
        ResourcesPage.clickChooseTypeFilter('building');

        NavbarPage.clickNavigateToExcavation();
        ResourcesPage.clickSelectMainTypeDocument(1);
        ResourcesPage.clickListModeButton();

        ProjectPage.get();
        browser.wait(EC.presenceOf(MapPage.getMapContainer()), delays.ECWaitTime);
        browser.wait(EC.presenceOf(ResourcesPage.getSelectedTypeFilterButton()), delays.ECWaitTime);

        NavbarPage.clickNavigateToExcavation();
        browser.wait(EC.stalenessOf(MapPage.getMapContainer()), delays.ECWaitTime);
        ResourcesPage.getSelectedMainTypeDocumentOption().then(value => expect(value[0]).toContain('excavation2'));
    });
});
