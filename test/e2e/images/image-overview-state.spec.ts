import {ImageOverviewPage} from './image-overview.page';
import {NavbarPage} from '../navbar.page';
import {SearchBarPage} from '../widgets/search-bar.page';
import {MenuPage} from '../menu.page';

const common = require('../common');

/**
 * @author Thomas Kleinke
 */
describe('images/state --', () => {

    beforeEach(() => {
        // MenuPage.navigateToImages();
        ImageOverviewPage.getAndWaitForImageCells()
    });


    afterEach(done => common.resetConfigJson().then(done));


    it('autoselect last selected type filter after returning to images overview', () => {

        ImageOverviewPage.getAllCells().then(cells => expect(cells.length).toBe(2));

        SearchBarPage.clickChooseTypeFilter('image-drawing', 'images');
        ImageOverviewPage.getAllCells().then(cells => expect(cells.length).toBe(1));

        NavbarPage.clickCloseNonResourcesTab();
        MenuPage.navigateToImages();

        SearchBarPage.getSelectedTypeFilterCharacter('images').then(value => expect(value).toEqual('Z'));
        ImageOverviewPage.getAllCells().then(cells => expect(cells.length).toBe(1));
    });


    it('restore query string after returning to images overview', () => {

        ImageOverviewPage.getAllCells().then(cells => expect(cells.length).toBe(2));

        SearchBarPage.typeInSearchField('Layer 1');
        ImageOverviewPage.getAllCells().then(cells => expect(cells.length).toBe(1));

        NavbarPage.clickCloseNonResourcesTab();
        MenuPage.navigateToImages();

        SearchBarPage.getSearchBarInputFieldValue().then(value => expect(value).toEqual('Layer 1'));
        ImageOverviewPage.getAllCells().then(cells => expect(cells.length).toBe(1));
    });


    it('restore grid size after returning to images overview', () => {

        ImageOverviewPage.clickIncreaseGridSizeButton();
        ImageOverviewPage.getGridSizeSliderValue().then(value => expect(value).toEqual('5'));

        NavbarPage.clickCloseNonResourcesTab();
        MenuPage.navigateToImages();

        ImageOverviewPage.getGridSizeSliderValue().then(value => expect(value).toEqual('5'));
    });
});
