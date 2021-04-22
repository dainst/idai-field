import { click, navigateTo, resetApp, start, stop, waitForExist, waitForNotExist } from '../app';
import { ImageOverviewPage } from './image-overview.page';
import { SearchBarPage } from '../widgets/search-bar.page';
import { DoceditPage } from '../docedit/docedit.page';
import { SearchConstraintsPage } from '../widgets/search-constraints.page';
import { ImageViewPage } from './image-view.page';
import { NavbarPage } from '../navbar.page';


describe('images --', function() {

    const resourceId1 = 'tf1';
    const resourceId2 = 'si0';


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


    async function createTwo() {

        await ImageOverviewPage.createDepictsRelation('testf1');
        await ImageOverviewPage.createDepictsRelation('SE0');
    }


    async function expectLinkBadgePresence(toBeTruthy: boolean, nrBadges: number = 1) {

        await _expectLinkBadgePresence(toBeTruthy, resourceId1);
        if (nrBadges == 2) await _expectLinkBadgePresence(toBeTruthy, resourceId2);
    }


    async function _expectLinkBadgePresence(toBeTruthy, relatedResourceId) {

        const cell = await ImageOverviewPage.getCell(0);
        await waitForExist(cell);
        const badge = (await cell.$$('#related-resource-' + relatedResourceId))[0];

        if (toBeTruthy) {
            expect(badge).toBeTruthy();
        } else {
            expect(badge).toBeFalsy();
        }
    }


    async function unlink() {

        await click(await ImageOverviewPage.getCell(0));
        await ImageOverviewPage.clickUnlinkButton();
        await ImageOverviewPage.clickConfirmUnlinkButton();
    }


    it('delete -- delete an image in the grid view', async done => {

        const identifier = await ImageOverviewPage.getCellImageName(0);
        await click(await ImageOverviewPage.getCell(0));
        await ImageOverviewPage.clickDeleteButton();
        await ImageOverviewPage.clickConfirmDeleteButton();
        await waitForNotExist(await ImageOverviewPage.getDeleteConfirmationModal());
        await waitForNotExist(await ImageOverviewPage.getCellByIdentifier(identifier));

        done();
    });


    it('delete -- delete two images in the grid view', async done => {

        const image1Identifier = await ImageOverviewPage.getCellImageName(0);
        const image2Identifier = await ImageOverviewPage.getCellImageName(1);
        await click(await ImageOverviewPage.getCell(0));
        await click(await ImageOverviewPage.getCell(1));
        await ImageOverviewPage.clickDeleteButton();
        await ImageOverviewPage.clickConfirmDeleteButton();
        await waitForNotExist(await ImageOverviewPage.getDeleteConfirmationModal());
        await waitForNotExist(await ImageOverviewPage.getCellByIdentifier(image1Identifier));
        await waitForNotExist(await ImageOverviewPage.getCellByIdentifier(image2Identifier));

        done();
    });


    it('delete -- cancel an image delete in the modal.', async done => {

        const elementToDelete = await ImageOverviewPage.getCell(0);
        const identifier = await ImageOverviewPage.getCellImageName(0);
        await click(elementToDelete);
        await ImageOverviewPage.clickDeleteButton();
        await ImageOverviewPage.clickCancelDeleteButton();
        await waitForNotExist(await ImageOverviewPage.getDeleteConfirmationModal());
        await waitForExist(await ImageOverviewPage.getCellByIdentifier(identifier));

        done();
    });


    it('deselect cells', async done => {

        const cells = await ImageOverviewPage.getAllCells();
        const first = 0;
        const last = cells.length - 1;

        await click(cells[first]);
        expect(await cells[first].getAttribute('class')).toMatch(ImageOverviewPage.selectedClass);
        await click(cells[first]);
        expect(await cells[first].getAttribute('class')).not.toMatch(ImageOverviewPage.selectedClass);
        if (last != first) {
            await click(cells[last]);
            expect(await cells[last].getAttribute('class')).toMatch(ImageOverviewPage.selectedClass);
            await click(cells[last]);
            expect(await cells[last].getAttribute('class')).not.toMatch(ImageOverviewPage.selectedClass);

            if (last > 1) {
                const middle = Math.floor(0.5 * (cells.length));
                await click(cells[middle]);
                expect(await cells[middle].getAttribute('class')).toMatch(ImageOverviewPage.selectedClass);
                await click(cells[middle]);
                expect(await cells[middle].getAttribute('class')).not.toMatch(ImageOverviewPage.selectedClass)
            }
        }

        done();
    });


    it('deselect images by clicking the corresponding button', async done => {

        await ImageOverviewPage.clickCell(0);
        expect(await (await ImageOverviewPage.getCell(0)).getAttribute('class'))
            .toMatch(ImageOverviewPage.selectedClass);
        await ImageOverviewPage.clickDeselectButton();
        expect(await (await ImageOverviewPage.getCell(0)).getAttribute('class'))
            .not.toMatch(ImageOverviewPage.selectedClass);

        done();
    });


    it('link -- link an image to a resource', async done => {

        await ImageOverviewPage.createDepictsRelation('testf1');
        await expectLinkBadgePresence(true);

        done();
    });


    it('link -- link one image to two resources', async done => {

        await createTwo();
        await expectLinkBadgePresence(true, 2);

        done();
    });


    it('link -- unlink an image from a resource', async done => {

        await ImageOverviewPage.createDepictsRelation('testf1');
        await unlink();
        await expectLinkBadgePresence(false);

        done();
    });


    it('link -- unlink two images from a resource', async done => {

        await createTwo();
        await unlink();
        await expectLinkBadgePresence(false, 2);

        done();
    });


    it('link -- filter categories in overview', async done => {

        await ImageOverviewPage.clickCell(0);
        await ImageOverviewPage.clickLinkButton();

        await SearchBarPage.typeInSearchField('S');
        let entries = await ImageOverviewPage.getLinkModalListEntries()
        expect(entries.length).toBeGreaterThan(2);

        await SearchBarPage.clickChooseCategoryFilter('operation-trench', 'modal');
        entries = await ImageOverviewPage.getLinkModalListEntries()
        expect(entries.length).toBe(2);

        await ImageOverviewPage.clickCancelLinkModalButton();
        await ImageOverviewPage.clickCell(0);

        done();
    });


    it('navigate from overview to view, and back to overview', async done => { // TODO Check: this test seems to be included in the test "perform constraint search"

        const imageName = await ImageOverviewPage.getCellImageName(0);

        await ImageOverviewPage.doubleClickCell(0);
        const identifier = (await ImageViewPage.getIdentifier()).replace('.', '_');
        expect(identifier).toContain(imageName);
        await ImageViewPage.clickCloseButton();

        await waitForExist(await ImageOverviewPage.getCell(0));
        const name = await ImageOverviewPage.getCellImageName(0);
        expect(name).toContain(imageName);

        done();
    });


    it('perform constraint search', async done => {

        await ImageOverviewPage.doubleClickCell(0);
        await ImageViewPage.editDocument();
        await DoceditPage.clickCheckbox('processor', 0);
        await DoceditPage.clickSaveDocument();
        await ImageViewPage.clickCloseButton();

        await SearchConstraintsPage.clickConstraintsMenuButton();
        await SearchConstraintsPage.clickSelectConstraintField('processor');
        await SearchConstraintsPage.clickSelectDropdownValue('Person 1');
        await SearchConstraintsPage.clickAddConstraintButton();

        await waitForNotExist(await ImageOverviewPage.getCellByIdentifier('PE07-So-07_Z001.jpg'));
        await waitForExist(await ImageOverviewPage.getCellByIdentifier('mapLayerTest2.png'));

        done();
    });


    it('do not allow setting the same identifier for two images', async done => {

        await ImageOverviewPage.doubleClickCell(0);
        await ImageViewPage.editDocument();
        await DoceditPage.typeInInputField('identifier', 'I1');
        await DoceditPage.clickSaveDocument();
        await ImageViewPage.clickCloseButton();

        await ImageOverviewPage.doubleClickCell(1);
        await ImageViewPage.editDocument();
        await DoceditPage.typeInInputField('identifier', 'I1');
        await DoceditPage.clickSaveDocument(false, false);

        await NavbarPage.awaitAlert('existiert bereits', false);
        await NavbarPage.clickCloseAllMessages();

        await DoceditPage.clickCloseEdit('discard');
        await ImageViewPage.clickCloseButton();

        done();
    });
});
