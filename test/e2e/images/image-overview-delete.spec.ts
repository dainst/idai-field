import {browser, element, by, protractor} from 'protractor';
import {ImageOverviewPage} from './image-overview.page';

const path = require('path');

const EC = protractor.ExpectedConditions;
const delays = require('../config/delays');

describe('images/image-overview/delete --', () => {

    beforeEach(() => {

        ImageOverviewPage.get();
    });

    it('delete an image in the grid view', () => {

        ImageOverviewPage.getCellImageName(0).then(identifier => {
            ImageOverviewPage.getCell(0).click();
            ImageOverviewPage.clickDeleteButton();
            ImageOverviewPage.clickConfirmDeleteButton();
            browser.wait(EC.stalenessOf(ImageOverviewPage.getDeleteConfirmationModal()), delays.ECWaitTime);
            browser.wait(EC.stalenessOf(ImageOverviewPage.getCellIdentifierElement(identifier)), delays.ECWaitTime);
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
                browser.wait(EC.stalenessOf(ImageOverviewPage.getCellIdentifierElement(image1Identifier)),
                    delays.ECWaitTime);
                browser.wait(EC.stalenessOf(ImageOverviewPage.getCellIdentifierElement(image2Identifier)),
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
            browser.wait(EC.presenceOf(element(by.id('resource-' + identifier))), delays.ECWaitTime);
        });
    });
});