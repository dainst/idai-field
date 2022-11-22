import { click, navigateTo, resetApp, start, stop, waitForExist, waitForNotExist } from '../app';
import { ImageOverviewPage } from './image-overview.page';
import { SearchBarPage } from '../widgets/search-bar.page';
import { DoceditPage } from '../docedit/docedit.page';
import { SearchConstraintsPage } from '../widgets/search-constraints.page';
import { ImageViewPage } from './image-view.page';
import { NavbarPage } from '../navbar.page';

const { test, expect } = require('@playwright/test');


test.describe('images --', function() {

    const resourceId1 = 'tf1';
    const resourceId2 = 'si0';


    test.beforeAll(async () => {

        await start();
    });


    test.beforeEach(async () => {

        await navigateTo('settings');
        await resetApp();
        await navigateTo('images');
        await ImageOverviewPage.waitForCells();
    });


    test.afterAll(async () => {

        await stop();
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
        const badge = (await cell.locator('#related-resource-' + relatedResourceId)).nth(0);

        if (toBeTruthy) {
            await waitForExist(badge);
        } else {
            await waitForNotExist(badge);
        }
    }


    async function unlink() {

        await click(await ImageOverviewPage.getCell(0));
        await ImageOverviewPage.clickUnlinkButton();
        await ImageOverviewPage.clickConfirmUnlinkButton();
    }


    test('delete -- delete an image in the grid view', async () => {

        const identifier = await ImageOverviewPage.getCellImageName(0);
        await click(await ImageOverviewPage.getCell(0));
        await ImageOverviewPage.clickDeleteButton();
        await ImageOverviewPage.clickConfirmDeleteButton();
        await waitForNotExist(await ImageOverviewPage.getDeleteConfirmationModal());
        await waitForNotExist(await ImageOverviewPage.getCellByIdentifier(identifier));
    });


    test('delete -- delete two images in the grid view', async () => {

        const image1Identifier = await ImageOverviewPage.getCellImageName(0);
        const image2Identifier = await ImageOverviewPage.getCellImageName(1);
        await click(await ImageOverviewPage.getCell(0));
        await click(await ImageOverviewPage.getCell(1));
        await ImageOverviewPage.clickDeleteButton();
        await ImageOverviewPage.clickConfirmDeleteButton();
        await waitForNotExist(await ImageOverviewPage.getDeleteConfirmationModal());
        await waitForNotExist(await ImageOverviewPage.getCellByIdentifier(image1Identifier));
        await waitForNotExist(await ImageOverviewPage.getCellByIdentifier(image2Identifier));
    });


    test('delete -- cancel an image delete in the modal.', async () => {

        const elementToDelete = await ImageOverviewPage.getCell(0);
        const identifier = await ImageOverviewPage.getCellImageName(0);
        await click(elementToDelete);
        await ImageOverviewPage.clickDeleteButton();
        await ImageOverviewPage.clickCancelDeleteButton();
        await waitForNotExist(await ImageOverviewPage.getDeleteConfirmationModal());
        await waitForExist(await ImageOverviewPage.getCellByIdentifier(identifier));
    });


    // TODO Rewrite test
    /*test('deselect cells', async () => {

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
    });*/


    test('deselect images by clicking the corresponding button', async () => {

        await ImageOverviewPage.clickCell(0);
        expect(await (await ImageOverviewPage.getCell(0)).getAttribute('class')).toMatch('selected');
        await ImageOverviewPage.clickDeselectButton();
        expect(await (await ImageOverviewPage.getCell(0)).getAttribute('class')).not.toMatch('selected');
    });


    test('link -- link an image to a resource', async () => {

        await ImageOverviewPage.createDepictsRelation('testf1');
        await expectLinkBadgePresence(true);
    });


    test('link -- link one image to two resources', async () => {

        await createTwo();
        await expectLinkBadgePresence(true, 2);
    });


    test('link -- unlink an image from a resource', async () => {

        await ImageOverviewPage.createDepictsRelation('testf1');
        await unlink();
        await expectLinkBadgePresence(false);
    });


    test('link -- unlink two images from a resource', async () => {

        await createTwo();
        await unlink();
        await expectLinkBadgePresence(false, 2);
    });


    test('link -- filter categories in overview', async () => {

        await ImageOverviewPage.clickCell(0);
        await ImageOverviewPage.clickLinkButton();

        await SearchBarPage.typeInSearchField('S');
        let entries = await ImageOverviewPage.getLinkModalListEntries();
        expect(await entries.count()).toBeGreaterThan(2);

        await SearchBarPage.clickChooseCategoryFilter('operation-trench', 'modal');
        entries = await ImageOverviewPage.getLinkModalListEntries();
        expect(await entries.count()).toBe(2);

        await ImageOverviewPage.clickCancelLinkModalButton();
        await ImageOverviewPage.clickCell(0);
    });


    test('navigate from overview to view, and back to overview', async () => {

        const imageName = await ImageOverviewPage.getCellImageName(0);

        await ImageOverviewPage.doubleClickCell(0);
        const identifier = (await ImageViewPage.getIdentifier()).replace('.', '_');
        expect(identifier).toContain(imageName);
        await ImageViewPage.clickCloseButton();

        await waitForExist(await ImageOverviewPage.getCell(0));
        const name = await ImageOverviewPage.getCellImageName(0);
        expect(name).toContain(imageName);
    });


    test('perform constraint search', async () => {

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
    });


    test('do not allow setting the same identifier for two images', async () => {

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
    });
});
