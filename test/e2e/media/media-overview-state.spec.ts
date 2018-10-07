import {MediaOverviewPage} from './media-overview.page';
import {NavbarPage} from '../navbar.page';
import {SearchBarPage} from '../widgets/search-bar.page';

const common = require('../common');

/**
 * @author Thomas Kleinke
 */
describe('media/media-overview/state --', () => {

    beforeEach(() => MediaOverviewPage.getAndWaitForImageCells());


    afterEach(done => common.resetConfigJson().then(done));


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
});
