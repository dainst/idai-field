import {browser} from 'protractor';
import {MediaOverviewPage} from './media-overview.page';
import {ProjectPage} from '../project.page';
import {NavbarPage} from '../navbar.page';
import {SearchBarPage} from '../widgets/search-bar.page';

const fs = require('fs');
const delays = require('../config/delays');
const common = require('../common');

/**
 * @author Thomas Kleinke
 */
describe('media/media-overview/state --', () => {

    const appDataPath = browser.params.appDataPath;


    beforeAll(() => {

        removeMediaStateFile();
    });


    beforeEach(() => {

        return MediaOverviewPage.getAndWaitForImageCells();
    });


    afterEach(done => {

        removeMediaStateFile();
        common.resetConfigJson().then(done);
    });


    function removeMediaStateFile() {

        const filePath = appDataPath + '/media-state-' + 'abc.json';
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }


    it('restore media state after restarting client', () => {

        ProjectPage.performCreateProject();
        MediaOverviewPage.get();

        SearchBarPage.typeInSearchField('test');
        SearchBarPage.clickChooseTypeFilter('image-drawing');
        MediaOverviewPage.clickIncreaseGridSizeButton();

        MediaOverviewPage.get();
        SearchBarPage.getSelectedTypeFilterCharacter().then(value => expect(value).toEqual('Z'));
        SearchBarPage.getSearchBarInputFieldValue().then(value => expect(value).toEqual('test'));
        MediaOverviewPage.getGridSizeSliderValue().then(value => expect(value).toEqual('5'));

        // TODO Add check for main type document filter select
    });


    it('autoselect last selected type filter after returning to media overview', () => {

        MediaOverviewPage.getAllCells().then(cells => expect(cells.length).toBe(6));

        SearchBarPage.clickChooseTypeFilter('image-drawing');
        MediaOverviewPage.getAllCells().then(cells => expect(cells.length).toBe(1));

        NavbarPage.clickNavigateToExcavation();
        NavbarPage.clickNavigateToMediaOverview();

        SearchBarPage.getSelectedTypeFilterCharacter().then(value => expect(value).toEqual('Z'));
        MediaOverviewPage.getAllCells().then(cells => expect(cells.length).toBe(1));
    });


    it('restore query string after returning to media overview', () => {

        MediaOverviewPage.getAllCells().then(cells => expect(cells.length).toBe(6));

        SearchBarPage.typeInSearchField('Layer 1');
        MediaOverviewPage.getAllCells().then(cells => expect(cells.length).toBe(1));

        NavbarPage.clickNavigateToExcavation();
        NavbarPage.clickNavigateToMediaOverview();

        SearchBarPage.getSearchBarInputFieldValue().then(value => expect(value).toEqual('Layer 1'));
        MediaOverviewPage.getAllCells().then(cells => expect(cells.length).toBe(1));
    });


    it('restore grid size after returning to media overview', () => {

        MediaOverviewPage.clickIncreaseGridSizeButton();
        MediaOverviewPage.getGridSizeSliderValue().then(value => expect(value).toEqual('5'));

        NavbarPage.clickNavigateToExcavation();
        NavbarPage.clickNavigateToMediaOverview();

        MediaOverviewPage.getGridSizeSliderValue().then(value => expect(value).toEqual('5'));
    });

    // TODO Write test for main type document filter select

});
