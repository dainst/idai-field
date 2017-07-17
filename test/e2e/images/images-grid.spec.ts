import {browser, protractor, element, by} from 'protractor';

let path = require('path');

let EC = protractor.ExpectedConditions;
let delays = require('../config/delays');

import {ImagesGridPage} from './images-grid.page';
import {ImagesViewPage} from './images-view.page';

describe('image grid --', function() {

    beforeEach(function () {
        ImagesGridPage.get();
        browser.wait(EC.visibilityOf(element(by.id('idai-field-brand'))), delays.ECWaitTime);
    });

    it('deselect cells', function() {
        ImagesGridPage.getAllCells().then(function(cells) {
            let first = 0;
            let last = cells.length - 1;

            cells[first].click();
            expect(cells[first].getAttribute('class')).toMatch(ImagesGridPage.selectedClass);
            cells[first].click();
            expect(cells[first].getAttribute('class')).not.toMatch(ImagesGridPage.selectedClass);
            if (last != first) {
                cells[last].click();
                expect(cells[last].getAttribute('class')).toMatch(ImagesGridPage.selectedClass);
                cells[last].click();
                expect(cells[last].getAttribute('class')).not.toMatch(ImagesGridPage.selectedClass);

                if (last > 1) {
                    var middle = Math.floor(0.5 * (cells.length));
                    cells[middle].click();
                    expect(cells[middle].getAttribute('class')).toMatch(ImagesGridPage.selectedClass);
                    cells[middle].click();
                    expect(cells[middle].getAttribute('class')).not.toMatch(ImagesGridPage.selectedClass);
                }
            }
        });
    });

    it('deselect images by clicking the corresponding button', function() {
        ImagesGridPage.clickCell(0);
        expect(ImagesGridPage.getCell(0).getAttribute('class')).toMatch(ImagesGridPage.selectedClass);
        ImagesGridPage.clickDeselectButton();
        expect(ImagesGridPage.getCell(0).getAttribute('class')).not.toMatch(ImagesGridPage.selectedClass);
    });

    it('delete an image in the grid view', function() {
        ImagesGridPage.getCellImageName(0)
            .then(function (filename) {
                ImagesGridPage.getCell(0).click();
                ImagesGridPage.clickDeleteButton();
                ImagesGridPage.clickConfirmDeleteButton();
                browser.wait(EC.stalenessOf(ImagesGridPage.getDeleteConfirmationModal()), delays.ECWaitTime);
                browser.wait(EC.stalenessOf(ImagesGridPage.getCellFilenameElement(filename)), delays.ECWaitTime);
            });
    });

    it('delete two images in the grid view', function() {
        ImagesGridPage.getCellImageName(0)
            .then(function (image1filename) {
                ImagesGridPage.getCellImageName(1)
                    .then(function (image2filename) {
                        ImagesGridPage.getCell(0).click();
                        ImagesGridPage.getCell(1).click();
                        ImagesGridPage.clickDeleteButton();
                        ImagesGridPage.clickConfirmDeleteButton();
                        browser.wait(EC.stalenessOf(ImagesGridPage.getDeleteConfirmationModal()), delays.ECWaitTime);
                        browser.wait(EC.stalenessOf(ImagesGridPage.getCellFilenameElement(image1filename)),
                            delays.ECWaitTime);
                        browser.wait(EC.stalenessOf(ImagesGridPage.getCellFilenameElement(image2filename)),
                            delays.ECWaitTime);
                    })
            });
    });

    it('connect a resource with an image in the grid view', function() {
        var imageToConnect = ImagesGridPage.getCell(0);
        var resourceId = 'tf1';
        var resourceIdentifier = 'testf1';

        imageToConnect.click();
        expect(imageToConnect.getAttribute('class')).toMatch(ImagesGridPage.selectedClass);
        ImagesGridPage.clickCreateRelationsButton();
        ImagesGridPage.typeInIdentifierInLinkModal(resourceIdentifier);
        ImagesGridPage.getSuggestedResourcesInLinkModalByIdentifier(resourceIdentifier).click();
        expect(imageToConnect.all(by.id('related-resource-'+resourceId)).first().isPresent()).toBeTruthy();
    });

    it('cancel an image delete in the modal.', function() {
        const elementToDelete = ImagesGridPage.getCell(0);

        ImagesGridPage.getCellImageName(0)
            .then(function (imageName) {
                const xpath = '//span[@class="badge badge-default"][text()="'+ imageName + '"]';
                elementToDelete.click();
                ImagesGridPage.clickDeleteButton();
                ImagesGridPage.clickCancelDeleteButton();
                browser.wait(EC.stalenessOf(ImagesGridPage.getDeleteConfirmationModal()), delays.ECWaitTime);
                browser.wait(EC.presenceOf(element(by.xpath(xpath))), delays.ECWaitTime)
            });
    });

    it('navigate from grid to view, and back to grid', function() {
        const xpath = '//h3[@class="fieldname"][text()="Dateiname"]/following-sibling::div[@class="fieldvalue"]';

        ImagesGridPage.getCellImageName(0).then(function(imageName){
            ImagesGridPage.doubleClickCell(0);
            browser.wait(EC.presenceOf(ImagesViewPage.getDocumentCard()), delays.ECWaitTime);
            element(by.xpath(xpath)).getText().then(imageName=>{expect(imageName).toEqual(imageName)});

            ImagesViewPage.clickBackToGridButton();
            browser.wait(EC.presenceOf(ImagesGridPage.getCell(0)), delays.ECWaitTime);
            ImagesGridPage.getCellImageName(0).then(imageName=>{expect(imageName).toEqual(imageName)});
        });
    });

    it('image upload should create a JSON document, which in turn gets displayed in the grid', function() {
        // image is already present in mediastore folder since uploading does not work in HttpMediastore
        const fileName = 'Aldrin_Apollo_11.jpg';
        const xpath = '//span[@class="badge badge-default"][text()="' + fileName + '"]';

        ImagesGridPage.clickUploadArea();
        ImagesGridPage.uploadImage(path.resolve(__dirname, '../../test-data/' + fileName));
        ImagesGridPage.chooseImageSubtype(0);
        browser.wait(EC.presenceOf(element(by.xpath(xpath))), delays.ECWaitTime);
    });
});