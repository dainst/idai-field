import {browser} from 'protractor';
import {ImageOverviewPage} from './image-overview.page';
import {ProjectPage} from '../project.page';

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

        ImageOverviewPage.typeInSearchField('test');
        ImageOverviewPage.clickChooseTypeFilter('image-drawing');
        ImageOverviewPage.clickIncreaseGridSizeButton();

        ImageOverviewPage.get();
        ImageOverviewPage.getSelectedTypeFilterCharacter().then(value => expect(value).toEqual('Z'));
        ImageOverviewPage.getSearchBarInputFieldValue().then(value => expect(value).toEqual('test'));
        ImageOverviewPage.getGridSizeSliderValue().then(value => expect(value).toEqual('5'));
    });

});
