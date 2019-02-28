import {ImageOverviewPage} from './image-overview.page';
import {NavbarPage} from '../navbar.page';
import {SearchBarPage} from '../widgets/search-bar.page';

const common = require('../common');

/**
 * @author Thomas Kleinke
 */
describe('images/state --', () => {

    beforeEach(() => ImageOverviewPage.getAndWaitForImageCells());


    afterEach(done => common.resetConfigJson().then(done));


    it('autoselect last selected type filter after returning to images overview', () => {

        ImageOverviewPage.getAllCells().then(cells => expect(cells.length).toBe(2));

        SearchBarPage.clickChooseTypeFilter('image-drawing', 'images');
        ImageOverviewPage.getAllCells().then(cells => expect(cells.length).toBe(1));

        NavbarPage.clickTab('project');
        NavbarPage.clickTab('images');

        SearchBarPage.getSelectedTypeFilterCharacter('images').then(value => expect(value).toEqual('Z'));
        ImageOverviewPage.getAllCells().then(cells => expect(cells.length).toBe(1));
    });


    it('restore query string after returning to images overview', () => {

        ImageOverviewPage.getAllCells().then(cells => expect(cells.length).toBe(2));

        SearchBarPage.typeInSearchField('Layer 1');
        ImageOverviewPage.getAllCells().then(cells => expect(cells.length).toBe(1));

        NavbarPage.clickTab('project');
        NavbarPage.clickTab('images');

        SearchBarPage.getSearchBarInputFieldValue().then(value => expect(value).toEqual('Layer 1'));
        ImageOverviewPage.getAllCells().then(cells => expect(cells.length).toBe(1));
    });


    it('restore grid size after returning to images overview', () => {

        ImageOverviewPage.clickIncreaseGridSizeButton();
        ImageOverviewPage.getGridSizeSliderValue().then(value => expect(value).toEqual('5'));

        NavbarPage.clickTab('project');
        NavbarPage.clickTab('images');

        ImageOverviewPage.getGridSizeSliderValue().then(value => expect(value).toEqual('5'));
    });
});
