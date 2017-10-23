import {browser} from 'protractor';
import {ImageOverviewPage} from './image-overview.page';
import {ProjectPage} from '../project.page';
import {NavbarPage} from '../navbar.page';
import {SearchBarPage} from '../widgets/search-bar.page';

const fs = require('fs');
const delays = require('../config/delays');
const common = require('../common');

/**
 * @author Thomas Kleinke
 */
describe('images/image-overview/state --', () => {

    const appDataPath = browser.params.appDataPath;


    beforeAll(() => {

        removeImagesStateFile();
    });


    beforeEach(() => {

        return ImageOverviewPage.getAndWaitForImageCells();
    });


    afterEach(done => {

        removeImagesStateFile();
        common.resetConfigJson().then(done);
    });


    function removeImagesStateFile() {

        const filePath = appDataPath + '/images-state-' + 'abc.json';
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }


    it('restore images state after restarting client', () => {

        ProjectPage.performCreateProject();
        ImageOverviewPage.get();

        SearchBarPage.typeInSearchField('test');
        SearchBarPage.clickChooseTypeFilter('image-drawing');
        ImageOverviewPage.clickIncreaseGridSizeButton();

        ImageOverviewPage.get();
        SearchBarPage.getSelectedTypeFilterCharacter().then(value => expect(value).toEqual('Z'));
        SearchBarPage.getSearchBarInputFieldValue().then(value => expect(value).toEqual('test'));
        ImageOverviewPage.getGridSizeSliderValue().then(value => expect(value).toEqual('5'));

        // TODO Add check for main type document filter select
    });


    it('autoselect last selected type filter after returning to images overview', () => {

        ImageOverviewPage.getAllCells().then(cells => expect(cells.length).toBe(2));

        SearchBarPage.clickChooseTypeFilter('image-drawing');
        ImageOverviewPage.getAllCells().then(cells => expect(cells.length).toBe(1));

        NavbarPage.clickNavigateToExcavation();
        NavbarPage.clickNavigateToImages();

        SearchBarPage.getSelectedTypeFilterCharacter().then(value => expect(value).toEqual('Z'));
        ImageOverviewPage.getAllCells().then(cells => expect(cells.length).toBe(1));
    });


    it('restore query string after returning to images overview', () => {

        ImageOverviewPage.getAllCells().then(cells => expect(cells.length).toBe(2));

        SearchBarPage.typeInSearchField('Layer 1');
        ImageOverviewPage.getAllCells().then(cells => expect(cells.length).toBe(1));

        NavbarPage.clickNavigateToExcavation();
        NavbarPage.clickNavigateToImages();

        SearchBarPage.getSearchBarInputFieldValue().then(value => expect(value).toEqual('Layer 1'));
        ImageOverviewPage.getAllCells().then(cells => expect(cells.length).toBe(1));
    });


    it('restore grid size after returning to images overview', () => {

        ImageOverviewPage.clickIncreaseGridSizeButton();
        ImageOverviewPage.getGridSizeSliderValue().then(value => expect(value).toEqual('5'));

        NavbarPage.clickNavigateToExcavation();
        NavbarPage.clickNavigateToImages();

        ImageOverviewPage.getGridSizeSliderValue().then(value => expect(value).toEqual('5'));
    });

    // TODO Write test for main type document filter select

});
