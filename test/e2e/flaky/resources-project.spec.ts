import {browser, protractor} from 'protractor';
import {NavbarPage} from '../navbar.page';
import {DocumentViewPage} from '../widgets/document-view.page';
import {ResourcesPage} from '../resources/resources.page';
import {ProjectPage} from '../project.page';
import {MapPage} from '../resources/map/map.page';
import {ImagesGridPage} from "../images/images-grid.page";

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

    function removeResourcesStateFile() {

        const filePath = appDataPath + '/resources-state-' + 'abc.json';
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    function createDepictsRelation() {

        browser.sleep(1000);
        NavbarPage.clickNavigateToImages();
        browser.sleep(1000);
        ImagesGridPage.createDepictsRelation('trench1');
        browser.sleep(1000);

        // ImagesGridPage.doubleClickCell(0);
        // DocumentViewPage.clickRelation(0);
    }

    it('switch from image to map view after click on depicts relation link', () => {

        createDepictsRelation();
        // browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('trench1')), delays.ECWaitTime);
    });

    xit('invalidate filter (if necessary) when switching from image to map view after click on depicts relation link', () => {

        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('trench1')), delays.ECWaitTime);
        ResourcesPage.clickChooseTypeFilter(1);
        browser.wait(EC.stalenessOf(ResourcesPage.getListItemEl('trench1')), delays.ECWaitTime); // make sure it disappeared

        createDepictsRelation();
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('trench1')), delays.ECWaitTime);
    });
});
