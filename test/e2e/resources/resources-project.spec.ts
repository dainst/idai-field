import {browser, protractor} from 'protractor';
import {NavbarPage} from '../navbar.page';
import {DocumentViewPage} from '../widgets/document-view.page';
import {ResourcesPage} from './resources.page';
import {ProjectPage} from '../project.page';
import {MapPage} from '../map/map.page';
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
