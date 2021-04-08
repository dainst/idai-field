import {ImageOverviewPage} from './image-overview.page';
import {NavbarPage} from '../navbar.page';
import {SearchBarPage} from '../widgets/search-bar.page';
import {MenuPage} from '../menu.page';
import {browser} from 'protractor';

const common = require('../common');

/**
 * @author Thomas Kleinke
 */
describe('images/state --', () => {

    beforeEach(() => {

        browser.sleep(1500);
        MenuPage.navigateToSettings();
        browser.sleep(1)
            .then(() => common.resetApp());
        browser.sleep(2000);
        MenuPage.navigateToImages();
        ImageOverviewPage.waitForCells();
    });


    afterEach(done => common.resetConfigJson().then(done));


    it('autoselect last selected category filter after returning to image overview', () => {

        ImageOverviewPage.getAllCells().then(cells => expect(cells.length).toBe(2));

        SearchBarPage.clickChooseCategoryFilter('image-drawing', 'images');
        ImageOverviewPage.getAllCells().then(cells => expect(cells.length).toBe(1));

        NavbarPage.clickCloseNonResourcesTab();
        MenuPage.navigateToImages();

        SearchBarPage.getSelectedCategoryFilterCharacter('images').then(value => {
            expect(value).toEqual('Z');
        });
        ImageOverviewPage.getAllCells().then(cells => expect(cells.length).toBe(1));
    });


    it('restore query string after returning to image overview', () => {

        ImageOverviewPage.getAllCells().then(cells => expect(cells.length).toBe(2));

        SearchBarPage.typeInSearchField('Layer 1');
        ImageOverviewPage.getAllCells().then(cells => expect(cells.length).toBe(1));

        NavbarPage.clickCloseNonResourcesTab();
        MenuPage.navigateToImages();

        SearchBarPage.getSearchBarInputFieldValue().then(value => {
            expect(value).toEqual('Layer 1');
        });
        ImageOverviewPage.getAllCells().then(cells => expect(cells.length).toBe(1));
    });


    it('restore grid size after returning to image overview', () => {

        ImageOverviewPage.clickIncreaseGridSizeButton();
        ImageOverviewPage.getGridSizeSliderValue().then(value => {
            expect(value).toEqual('5');
        });

        NavbarPage.clickCloseNonResourcesTab();
        MenuPage.navigateToImages();

        ImageOverviewPage.getGridSizeSliderValue().then(value => {
            expect(value).toEqual('5');
        });
    });
});
