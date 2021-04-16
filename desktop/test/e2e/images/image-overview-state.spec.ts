import { navigateTo, pause, resetApp, start, stop } from '../app';
import { ImageOverviewPage } from './image-overview.page';
import { NavbarPage } from '../navbar.page';
import { SearchBarPage } from '../widgets/search-bar.page';


/**
 * @author Thomas Kleinke
 */
describe('images/state --', () => {

    beforeAll(async done => {

        await start();
        done();
    });


    beforeEach(async done => {

        await navigateTo('settings');
        await resetApp();
        await navigateTo('images');
        await ImageOverviewPage.waitForCells();
        done();
    });


    afterAll(async done => {

        await stop();
        done();
    });


    it('autoselect last selected category filter after returning to image overview', async done => {

        let cells = await ImageOverviewPage.getAllCells();
        expect(cells.length).toBe(2);

        await SearchBarPage.clickChooseCategoryFilter('image-drawing', 'images');
        await pause(1000);
        cells = await ImageOverviewPage.getAllCells();
        expect(cells.length).toBe(1);

        await NavbarPage.clickCloseNonResourcesTab();
        await navigateTo('images');
        await pause(1000);

        const value = await SearchBarPage.getSelectedCategoryFilterCharacter('images');
        expect(value).toEqual('Z');

        cells = await ImageOverviewPage.getAllCells();
        expect(cells.length).toBe(1);

        done();
    });


    it('restore query string after returning to image overview', async done => {

        let cells = await ImageOverviewPage.getAllCells();
        expect(cells.length).toBe(2);

        await SearchBarPage.typeInSearchField('Layer 1');
        await pause(1000);
        cells = await ImageOverviewPage.getAllCells();
        expect(cells.length).toBe(1);

        await NavbarPage.clickCloseNonResourcesTab();
        await navigateTo('images');
        await pause(1000);

        const value = await SearchBarPage.getSearchBarInputFieldValue();
        expect(value).toEqual('Layer 1');

        cells = await ImageOverviewPage.getAllCells();
        expect(cells.length).toBe(1);

        done();
    });


    it('restore grid size after returning to image overview', async done => {

        await ImageOverviewPage.clickIncreaseGridSizeButton();
        let value = await ImageOverviewPage.getGridSizeSliderValue();
        expect(value).toEqual('5');

        await NavbarPage.clickCloseNonResourcesTab();
        await navigateTo('images');
        await pause(1000);

        value = await ImageOverviewPage.getGridSizeSliderValue();
        expect(value).toEqual('5');

        done();
    });
});
