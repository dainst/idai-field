import {browser} from 'protractor';
import {ImageOverviewPage} from './image-overview.page';
import {ProjectPage} from '../project.page';
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

        return ImageOverviewPage.get();
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
    });

});
