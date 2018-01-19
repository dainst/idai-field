import {ImageOverviewPage} from './image-overview.page';
import {NavbarPage} from '../navbar.page';
import {SearchBarPage} from '../widgets/search-bar.page';

const common = require('../common');

/**
 * @author Thomas Kleinke
 */
describe('images/image-overview/state --', () => {


    beforeEach(() => ImageOverviewPage.getAndWaitForImageCells());


    afterEach(done => common.resetConfigJson().then(done));


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
