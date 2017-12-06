import {browser, protractor} from 'protractor';
import {ImageOverviewPage} from './image-overview.page';
import {NavbarPage} from "../navbar.page";
const request = require('request');

const EC = protractor.ExpectedConditions;
const delays = require('../config/delays');

describe('images/image-overview/delete --', () => {

    beforeAll(() => {

        ImageOverviewPage.getAndWaitForImageCells();
        browser.sleep(delays.shortRest * 3);
    });

    let i = 0;

    beforeEach(() => {

        if (i > 0) {
            NavbarPage.performNavigateToSettings();
            request.post('http://localhost:3003/reset', {});
            browser.sleep(delays.shortRest);
            NavbarPage.clickNavigateToImages();
            ImageOverviewPage.waitForCells();
            browser.sleep(delays.shortRest * 10);
        }
        i++;
    });

    it('delete an image in the grid view', () => {

        ImageOverviewPage.getCellImageName(0).then(identifier => {
            ImageOverviewPage.getCell(0).click();
            ImageOverviewPage.clickDeleteButton();
            ImageOverviewPage.clickConfirmDeleteButton();
            browser.wait(EC.stalenessOf(ImageOverviewPage.getDeleteConfirmationModal()), delays.ECWaitTime);
            browser.wait(EC.stalenessOf(ImageOverviewPage.getCellByIdentifier(identifier)), delays.ECWaitTime);
        });
    });

    it('delete two images in the grid view', () => {

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

    it('cancel an image delete in the modal.', () => {

        const elementToDelete = ImageOverviewPage.getCell(0);

        ImageOverviewPage.getCellImageName(0).then(identifier => {
            elementToDelete.click();
            ImageOverviewPage.clickDeleteButton();
            ImageOverviewPage.clickCancelDeleteButton();
            browser.wait(EC.stalenessOf(ImageOverviewPage.getDeleteConfirmationModal()), delays.ECWaitTime);
            browser.wait(EC.presenceOf(ImageOverviewPage.getCellByIdentifier(identifier)), delays.ECWaitTime);
        });
    });
});