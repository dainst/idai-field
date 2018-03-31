import {browser, protractor} from 'protractor';
import {MediaOverviewPage} from './media-overview.page';
import {NavbarPage} from "../navbar.page";
const request = require('request');

const EC = protractor.ExpectedConditions;
const delays = require('../config/delays');

describe('media/media-overview/delete --', () => {

    beforeAll(() => {

        MediaOverviewPage.getAndWaitForImageCells();
        browser.sleep(delays.shortRest * 3);
    });

    let i = 0;

    beforeEach(() => {

        if (i > 0) {
            NavbarPage.performNavigateToSettings();
            request.post('http://localhost:3003/reset', {});
            browser.sleep(delays.shortRest);
            NavbarPage.clickNavigateToMediaOverview();
            MediaOverviewPage.waitForCells();
            browser.sleep(delays.shortRest * 10);
        }
        i++;
    });

    it('delete an image in the grid view', () => {

        MediaOverviewPage.getCellMediaResourceName(0).then(identifier => {
            MediaOverviewPage.getCell(0).click();
            MediaOverviewPage.clickDeleteButton();
            MediaOverviewPage.clickConfirmDeleteButton();
            browser.wait(EC.stalenessOf(MediaOverviewPage.getDeleteConfirmationModal()), delays.ECWaitTime);
            browser.wait(EC.stalenessOf(MediaOverviewPage.getCellByIdentifier(identifier)), delays.ECWaitTime);
        });
    });

    it('delete two images in the grid view', () => {

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

    it('cancel an image delete in the modal.', () => {

        const elementToDelete = MediaOverviewPage.getCell(0);

        MediaOverviewPage.getCellMediaResourceName(0).then(identifier => {
            elementToDelete.click();
            MediaOverviewPage.clickDeleteButton();
            MediaOverviewPage.clickCancelDeleteButton();
            browser.wait(EC.stalenessOf(MediaOverviewPage.getDeleteConfirmationModal()), delays.ECWaitTime);
            browser.wait(EC.presenceOf(MediaOverviewPage.getCellByIdentifier(identifier)), delays.ECWaitTime);
        });
    });
});