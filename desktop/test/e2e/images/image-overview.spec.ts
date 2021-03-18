import {browser, protractor, by} from 'protractor';
import {ImageOverviewPage} from './image-overview.page';
import {MenuPage} from '../menu.page';
import {SearchBarPage} from '../widgets/search-bar.page';
import {DoceditPage} from '../docedit/docedit.page';
import {SearchConstraintsPage} from '../widgets/search-constraints.page';
import {ImageViewPage} from './image-view.page';
import {NavbarPage} from '../navbar.page';

const EC = protractor.ExpectedConditions;
const delays = require('../delays');
const common = require('../common');


describe('images --', function() {

    const resourceId1 = 'tf1';
    const resourceId2 = 'si0';


    function createTwo() {

        ImageOverviewPage.createDepictsRelation('testf1');
        ImageOverviewPage.createDepictsRelation('SE0');
    }


    function expectLinkBadgePresence(toBeTruthy: boolean, nrBadges: number = 1) {

        _expectLinkBadgePresence(toBeTruthy, resourceId1);
        if (nrBadges == 2) _expectLinkBadgePresence(toBeTruthy, resourceId2);
    }


    function _expectLinkBadgePresence(toBeTruthy, relatedResourceId) {

        const expectation = expect(ImageOverviewPage.getCell(0)
            .all(by.id('related-resource-' + relatedResourceId))
            .first().isPresent());

        if (toBeTruthy) expectation.toBeTruthy();
        else expectation.toBeFalsy();
    }


    function unlink() {

        ImageOverviewPage.getCell(0).click();
        ImageOverviewPage.clickUnlinkButton();
        ImageOverviewPage.clickConfirmUnlinkButton();
        browser.sleep(delays.shortRest);
    }


    beforeEach(() => {

        browser.sleep(1000);

        MenuPage.navigateToSettings();
        common.resetApp();
        MenuPage.navigateToImages();
        ImageOverviewPage.waitForCells();
    });


    it('delete -- delete an image in the grid view', () => {

        ImageOverviewPage.getCellImageName(0).then(identifier => {
            ImageOverviewPage.getCell(0).click();
            ImageOverviewPage.clickDeleteButton();
            ImageOverviewPage.clickConfirmDeleteButton();
            browser.wait(EC.stalenessOf(ImageOverviewPage.getDeleteConfirmationModal()), delays.ECWaitTime);
            browser.wait(EC.stalenessOf(ImageOverviewPage.getCellByIdentifier(identifier)), delays.ECWaitTime);
        });
    });


    it('delete -- delete two images in the grid view', () => {

        ImageOverviewPage.getCellImageName(0).then(image1Identifier => {
            ImageOverviewPage.getCellImageName(1).then(image2Identifier => {
                ImageOverviewPage.getCell(0).click();
                ImageOverviewPage.getCell(1).click();
                ImageOverviewPage.clickDeleteButton();
                ImageOverviewPage.clickConfirmDeleteButton();
                browser.wait(EC.stalenessOf(ImageOverviewPage.getDeleteConfirmationModal()), delays.ECWaitTime);
                browser.wait(EC.stalenessOf(ImageOverviewPage.getCellByIdentifier(image1Identifier)),
                    delays.ECWaitTime);
                browser.wait(EC.stalenessOf(ImageOverviewPage.getCellByIdentifier(image2Identifier)),
                    delays.ECWaitTime);
            });
        });
    });


    it('delete -- cancel an image delete in the modal.', () => {

        const elementToDelete = ImageOverviewPage.getCell(0);

        ImageOverviewPage.getCellImageName(0).then(identifier => {
            elementToDelete.click();
            ImageOverviewPage.clickDeleteButton();
            ImageOverviewPage.clickCancelDeleteButton();
            browser.wait(EC.stalenessOf(ImageOverviewPage.getDeleteConfirmationModal()), delays.ECWaitTime);
            browser.wait(EC.presenceOf(ImageOverviewPage.getCellByIdentifier(identifier)), delays.ECWaitTime);
        });
    });


    it('deselect cells', () => {

        ImageOverviewPage.getAllCells().then(function(cells) {
            const first = 0;
            const last = cells.length - 1;

            cells[first].click();
            expect(cells[first].getAttribute('class')).toMatch(ImageOverviewPage.selectedClass);
            cells[first].click();
            expect(cells[first].getAttribute('class')).not.toMatch(ImageOverviewPage.selectedClass);
            if (last != first) {
                cells[last].click();
                expect(cells[last].getAttribute('class')).toMatch(ImageOverviewPage.selectedClass);
                cells[last].click();
                expect(cells[last].getAttribute('class')).not.toMatch(ImageOverviewPage.selectedClass);

                if (last > 1) {
                    const middle = Math.floor(0.5 * (cells.length));
                    cells[middle].click();
                    expect(cells[middle].getAttribute('class')).toMatch(ImageOverviewPage.selectedClass);
                    cells[middle].click();
                    expect(cells[middle].getAttribute('class')).not.toMatch(ImageOverviewPage.selectedClass)
                }
            }
        });
    });


    it('deselect images by clicking the corresponding button', () => {

        ImageOverviewPage.clickCell(0);
        expect(ImageOverviewPage.getCell(0).getAttribute('class')).toMatch(ImageOverviewPage.selectedClass);
        ImageOverviewPage.clickDeselectButton();
        expect(ImageOverviewPage.getCell(0).getAttribute('class')).not.toMatch(ImageOverviewPage.selectedClass);
    });


    it('link -- link an image to a resource', () => {

        ImageOverviewPage.createDepictsRelation('testf1');
        expectLinkBadgePresence(true);
    });


    it('link -- link one image to two resources', () => {

        createTwo();
        expectLinkBadgePresence(true, 2);
        browser.sleep(delays.shortRest);
    });


    it('link -- unlink an image from a resource', () => {

        ImageOverviewPage.createDepictsRelation('testf1');
        unlink();
        browser.sleep(delays.shortRest);
        expectLinkBadgePresence(false);
    });


    it('link -- unlink two images from a resource', () => {

        createTwo();
        unlink();
        browser.sleep(delays.shortRest);
        expectLinkBadgePresence(false, 2);
    });


    it('link -- filter categories in overview', done => {

        ImageOverviewPage.clickCell(0);
        ImageOverviewPage.clickLinkButton();
        SearchBarPage.typeInSearchField('S');
        ImageOverviewPage.getLinkModalListEntries()
            .then(esBefore => expect(esBefore.length).toBeGreaterThan(2));
        SearchBarPage.clickChooseCategoryFilter('operation-trench', 'modal');
        ImageOverviewPage.getLinkModalListEntries()
            .then(esAfter => expect(esAfter.length).toBe(2));
        ImageOverviewPage.clickCancelLinkModalButton();

        done();
    });


    it('navigate from overview to view, and back to overview', async done => { // this test seems to be included in the test "perform constraint search"

        const imageName = await ImageOverviewPage.getCellImageName(0);

        ImageOverviewPage.doubleClickCell(0);
        ImageViewPage.getIdentifier().then(identifier => expect(identifier).toContain(imageName));
        ImageViewPage.clickCloseButton();

        browser.wait(EC.presenceOf(ImageOverviewPage.getCell(0)), delays.ECWaitTime);
        ImageOverviewPage.getCellImageName(0).then(name => expect(name).toContain(imageName));
        done();
    });


    it('perform constraint search', () => {

        ImageOverviewPage.doubleClickCell(0);
        ImageViewPage.editDocument();
        DoceditPage.clickCheckbox('processor', 0);
        DoceditPage.clickSaveDocument();
        ImageViewPage.clickCloseButton();
        ImageOverviewPage.clickDeselectButton();

        SearchConstraintsPage.clickConstraintsMenuButton();
        SearchConstraintsPage.clickSelectConstraintField('processor');
        SearchConstraintsPage.clickSelectDropdownValue(3);
        SearchConstraintsPage.clickAddConstraintButton();

        browser.wait(EC.stalenessOf(ImageOverviewPage.getCellByIdentifier('PE07-So-07_Z001.jpg')),
            delays.ECWaitTime);
        browser.wait(EC.presenceOf(ImageOverviewPage.getCellByIdentifier('mapLayerTest2.png')),
            delays.ECWaitTime);
    });


    it('do not allow setting the same identifier for two images', () => {

        ImageOverviewPage.doubleClickCell(0);
        ImageViewPage.editDocument();
        DoceditPage.typeInInputField('identifier', 'I1');
        DoceditPage.clickSaveDocument();
        ImageViewPage.clickCloseButton();

        ImageOverviewPage.doubleClickCell(1);
        ImageViewPage.editDocument();
        DoceditPage.typeInInputField('identifier', 'I1');
        DoceditPage.clickSaveDocument(false, false);

        NavbarPage.awaitAlert('existiert bereits', false);
        NavbarPage.clickCloseAllMessages();

        DoceditPage.clickCloseEdit('discard');
        ImageViewPage.clickCloseButton();
    });
});
