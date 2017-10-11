import {browser, by, element, protractor} from 'protractor';
import {ImageOverviewPage} from './image-overview.page';

const path = require('path');

const EC = protractor.ExpectedConditions;
const delays = require('../config/delays');

describe('images/image-overview/delete --', function() {

    beforeEach(() => {

        ImageOverviewPage.get();
    });

    it('delete an image in the grid view', () => {

        ImageOverviewPage.getCellImageName(0)
            .then(function (filename) {
                ImageOverviewPage.getCell(0).click();
                ImageOverviewPage.clickDeleteButton();
                ImageOverviewPage.clickConfirmDeleteButton();
                browser.wait(EC.stalenessOf(ImageOverviewPage.getDeleteConfirmationModal()), delays.ECWaitTime);
                browser.wait(EC.stalenessOf(ImageOverviewPage.getCellFilenameElement(filename)), delays.ECWaitTime);
            });
    });

    it('delete two images in the grid view', () => {

        ImageOverviewPage.getCellImageName(0)
            .then(function (image1filename) {
                ImageOverviewPage.getCellImageName(1)
                    .then(function (image2filename) {
                        ImageOverviewPage.getCell(0).click();
                        ImageOverviewPage.getCell(1).click();
                        ImageOverviewPage.clickDeleteButton();
                        ImageOverviewPage.clickConfirmDeleteButton();
                        browser.wait(EC.stalenessOf(ImageOverviewPage.getDeleteConfirmationModal()), delays.ECWaitTime);
                        browser.wait(EC.stalenessOf(ImageOverviewPage.getCellFilenameElement(image1filename)),
                            delays.ECWaitTime);
                        browser.wait(EC.stalenessOf(ImageOverviewPage.getCellFilenameElement(image2filename)),
                            delays.ECWaitTime);
                    })
            });
    });

    it('cancel an image delete in the modal.', () => {

        const elementToDelete = ImageOverviewPage.getCell(0);

        ImageOverviewPage.getCellImageName(0).then(imageName => {
            elementToDelete.click();
            ImageOverviewPage.clickDeleteButton();
            ImageOverviewPage.clickCancelDeleteButton();
            browser.wait(EC.stalenessOf(ImageOverviewPage.getDeleteConfirmationModal()), delays.ECWaitTime);
            browser.wait(EC.presenceOf(element(by.id('resource-' + imageName))), delays.ECWaitTime);
        });
    });
});