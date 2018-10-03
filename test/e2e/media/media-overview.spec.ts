import {browser, protractor, by} from 'protractor';
import {MediaOverviewPage} from './media-overview.page';
import {NavbarPage} from '../navbar.page';
import {DetailSidebarPage} from '../widgets/detail-sidebar.page';
import {FieldsViewPage} from '../widgets/fields-view-page';
import {SearchBarPage} from '../widgets/search-bar.page';

const EC = protractor.ExpectedConditions;
const delays = require('../config/delays');
const common = require('../common');


describe('media/media-overview --', function() {

    const resourceId1 = 'tf1';
    const resourceId2 = 'si0';

    let i = 0;


    function createTwo() {

        MediaOverviewPage.createDepictsRelation('testf1');
        MediaOverviewPage.createDepictsRelation('SE0');
    }


    function expectLinkBadgePresence(toBeTruthy: boolean, nrBadges: number = 1) {

        _expectLinkBadgePresence(toBeTruthy, resourceId1);
        if (nrBadges == 2) _expectLinkBadgePresence(toBeTruthy, resourceId2);
    }


    function _expectLinkBadgePresence(toBeTruthy, relatedResourceId) {

        const exp = expect(MediaOverviewPage.getCell(0)
            .all(by.id('related-resource-'+relatedResourceId))
            .first().isPresent());

        if (toBeTruthy) exp.toBeTruthy();
        else exp.toBeFalsy();
    }


    function unlink() {

        MediaOverviewPage.getCell(0).click();
        MediaOverviewPage.clickUnlinkButton();
        MediaOverviewPage.clickConfirmUnlinkButton();
        browser.sleep(delays.shortRest);
    }
    

    beforeAll(() => {

        MediaOverviewPage.getAndWaitForImageCells();
        browser.sleep(delays.shortRest * 3);
    });


    beforeEach(async done => {

        if (i > 0) {
            NavbarPage.performNavigateToSettings();
            await common.resetApp();
            browser.sleep(delays.shortRest * 3);
            NavbarPage.clickNavigateToMediaOverview();
            MediaOverviewPage.waitForCells();
            browser.sleep(delays.shortRest);
        }

        i++;
        done();
    });


    it('delete -- delete an image in the grid view', () => {

        MediaOverviewPage.getCellMediaResourceName(0).then(identifier => {
            MediaOverviewPage.getCell(0).click();
            MediaOverviewPage.clickDeleteButton();
            MediaOverviewPage.clickConfirmDeleteButton();
            browser.wait(EC.stalenessOf(MediaOverviewPage.getDeleteConfirmationModal()), delays.ECWaitTime);
            browser.wait(EC.stalenessOf(MediaOverviewPage.getCellByIdentifier(identifier)), delays.ECWaitTime);
        });
    });


    it('delete -- delete two images in the grid view', () => {

        MediaOverviewPage.getCellMediaResourceName(0).then(image1Identifier => {
            MediaOverviewPage.getCellMediaResourceName(1).then(image2Identifier => {
                MediaOverviewPage.getCell(0).click();
                MediaOverviewPage.getCell(1).click();
                MediaOverviewPage.clickDeleteButton();
                MediaOverviewPage.clickConfirmDeleteButton();
                browser.wait(EC.stalenessOf(MediaOverviewPage.getDeleteConfirmationModal()), delays.ECWaitTime);
                browser.wait(EC.stalenessOf(MediaOverviewPage.getCellByIdentifier(image1Identifier)),
                    delays.ECWaitTime);
                browser.wait(EC.stalenessOf(MediaOverviewPage.getCellByIdentifier(image2Identifier)),
                    delays.ECWaitTime);
            });
        });
    });


    it('delete -- cancel an image delete in the modal.', () => {

        const elementToDelete = MediaOverviewPage.getCell(0);

        MediaOverviewPage.getCellMediaResourceName(0).then(identifier => {
            elementToDelete.click();
            MediaOverviewPage.clickDeleteButton();
            MediaOverviewPage.clickCancelDeleteButton();
            browser.wait(EC.stalenessOf(MediaOverviewPage.getDeleteConfirmationModal()), delays.ECWaitTime);
            browser.wait(EC.presenceOf(MediaOverviewPage.getCellByIdentifier(identifier)), delays.ECWaitTime);
        });
    });


    it('deselect cells', () => {

        MediaOverviewPage.getAllCells().then(function(cells) {
            const first = 0;
            const last = cells.length - 1;

            cells[first].click();
            expect(cells[first].getAttribute('class')).toMatch(MediaOverviewPage.selectedClass);
            cells[first].click();
            expect(cells[first].getAttribute('class')).not.toMatch(MediaOverviewPage.selectedClass);
            if (last != first) {
                cells[last].click();
                expect(cells[last].getAttribute('class')).toMatch(MediaOverviewPage.selectedClass);
                cells[last].click();
                expect(cells[last].getAttribute('class')).not.toMatch(MediaOverviewPage.selectedClass);

                if (last > 1) {
                    const middle = Math.floor(0.5 * (cells.length));
                    cells[middle].click();
                    expect(cells[middle].getAttribute('class')).toMatch(MediaOverviewPage.selectedClass);
                    cells[middle].click();
                    expect(cells[middle].getAttribute('class')).not.toMatch(MediaOverviewPage.selectedClass)
                }
            }
        });
    });


    it('deselect media resources by clicking the corresponding button', () => {

        MediaOverviewPage.clickCell(0);
        expect(MediaOverviewPage.getCell(0).getAttribute('class')).toMatch(MediaOverviewPage.selectedClass);
        MediaOverviewPage.clickDeselectButton();
        expect(MediaOverviewPage.getCell(0).getAttribute('class')).not.toMatch(MediaOverviewPage.selectedClass);
    });


    it('navigate from overview to image view, and back to overview', async done => {

        const imageName = await MediaOverviewPage.getCellMediaResourceName(0);

        MediaOverviewPage.doubleClickCell(0);
        browser.wait(EC.presenceOf(DetailSidebarPage.getDocumentCard()), delays.ECWaitTime);
        FieldsViewPage.clickFieldsTab();
        DetailSidebarPage.getIdentifier()
            .then(identifier => expect(identifier).toContain(imageName));

        DetailSidebarPage.clickBackToGridButton();
        browser.wait(EC.presenceOf(MediaOverviewPage.getCell(0)), delays.ECWaitTime);
        MediaOverviewPage.getCellMediaResourceName(0).then(name => expect(name).toContain(imageName));

        done();
    });


    it('link -- link an image to a resource', () => {

        MediaOverviewPage.createDepictsRelation('testf1');
        expectLinkBadgePresence(true);
    });


    it('link -- link one image to two resources', () => {

        createTwo();
        expectLinkBadgePresence(true, 2);
        browser.sleep(delays.shortRest);
    });


    it('link -- unlink an image from a resource', () => {

        MediaOverviewPage.createDepictsRelation('testf1');
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


    it('link -- use main type document filter', () => {

        MediaOverviewPage.createDepictsRelation('testf1');

        MediaOverviewPage.clickSelectMainTypeDocumentFilterOption(1);
        browser.wait(EC.presenceOf(MediaOverviewPage.getCellByIdentifier('PE07-So-07_Z001.jpg')),
            delays.ECWaitTime);
        browser.wait(EC.stalenessOf(MediaOverviewPage.getCellByIdentifier('mapLayerTest2.png')),
            delays.ECWaitTime);

        MediaOverviewPage.clickSelectMainTypeDocumentFilterOption(2);
        browser.wait(EC.stalenessOf(MediaOverviewPage.getCellByIdentifier('PE07-So-07_Z001.jpg')),
            delays.ECWaitTime);
        browser.wait(EC.presenceOf(MediaOverviewPage.getCellByIdentifier('mapLayerTest2.png')),
            delays.ECWaitTime);

        MediaOverviewPage.clickSelectMainTypeDocumentFilterOption(0);
        browser.wait(EC.presenceOf(MediaOverviewPage.getCellByIdentifier('PE07-So-07_Z001.jpg')),
            delays.ECWaitTime);
        browser.wait(EC.presenceOf(MediaOverviewPage.getCellByIdentifier('mapLayerTest2.png')),
            delays.ECWaitTime);
    });


    it('link -- filter types in overview', async done => {

        MediaOverviewPage.clickCell(0);
        MediaOverviewPage.clickLinkButton();
        SearchBarPage.typeInSearchField('S');
        MediaOverviewPage.getLinkModalListEntries()
            .then(esBefore => expect(esBefore.length).toBeGreaterThan(2));
        SearchBarPage.clickChooseTypeFilter('operation-trench');
        MediaOverviewPage.getLinkModalListEntries()
            .then(esAfter => expect(esAfter.length).toBe(2));
        done();
    });
});