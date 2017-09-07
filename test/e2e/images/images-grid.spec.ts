import {browser, by, element, protractor} from 'protractor';
import {ImagesGridPage} from './images-grid.page';
import {ImagesViewPage} from './images-view.page';
import {NavbarPage} from '../navbar.page';
import {ResourcesPage} from '../resources/resources.page';

let path = require('path');

let EC = protractor.ExpectedConditions;
let delays = require('../config/delays');

describe('images/image-grid --', function() {

    beforeEach(() => {

        ResourcesPage.get();
        browser.wait(EC.visibilityOf(element(by.id('idai-field-brand'))), delays.ECWaitTime);
        browser.sleep(1000);
        NavbarPage.clickNavigateToImages();
        browser.sleep(delays.shortRest);
    });

    it('image upload should create a JSON document, which in turn gets displayed in the grid', () => {

        // image is already present in mediastore folder since uploading does not work in HttpMediastore
        const fileName = 'Aldrin_Apollo_11.jpg';
        const xpath = '//span[@class="badge badge-secondary"][text()="' + fileName + '"]';

        ImagesGridPage.clickUploadArea();
        ImagesGridPage.uploadImage(path.resolve(__dirname, '../../test-data/' + fileName));
        ImagesGridPage.chooseImageSubtype(0);
        browser.wait(EC.presenceOf(element(by.xpath(xpath))), delays.ECWaitTime);
    });

    it('deselect cells', () => {

        ImagesGridPage.getAllCells().then(function(cells) {
            const first = 0;
            const last = cells.length - 1;

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
                    const middle = Math.floor(0.5 * (cells.length));
                    cells[middle].click();
                    expect(cells[middle].getAttribute('class')).toMatch(ImagesGridPage.selectedClass);
                    cells[middle].click();
                    expect(cells[middle].getAttribute('class')).not.toMatch(ImagesGridPage.selectedClass);
                }
            }
        });
    });

    it('deselect images by clicking the corresponding button', () => {

        ImagesGridPage.clickCell(0);
        expect(ImagesGridPage.getCell(0).getAttribute('class')).toMatch(ImagesGridPage.selectedClass);
        ImagesGridPage.clickDeselectButton();
        expect(ImagesGridPage.getCell(0).getAttribute('class')).not.toMatch(ImagesGridPage.selectedClass);
    });

    it('delete an image in the grid view', () => {

        ImagesGridPage.getCellImageName(0)
            .then(function (filename) {
                ImagesGridPage.getCell(0).click();
                ImagesGridPage.clickDeleteButton();
                ImagesGridPage.clickConfirmDeleteButton();
                browser.wait(EC.stalenessOf(ImagesGridPage.getDeleteConfirmationModal()), delays.ECWaitTime);
                browser.wait(EC.stalenessOf(ImagesGridPage.getCellFilenameElement(filename)), delays.ECWaitTime);
            });
    });

    it('delete two images in the grid view', () => {

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

    it('connect a resource with an image in the grid view', () => {

        const resourceId = 'tf1';
        ImagesGridPage.createDepictsRelation('testf1');
        expect(ImagesGridPage.getCell(0).all(by.id('related-resource-'+resourceId)).first().isPresent()).toBeTruthy();
    });

    it('cancel an image delete in the modal.', () => {

        const elementToDelete = ImagesGridPage.getCell(0);

        ImagesGridPage.getCellImageName(0)
            .then(function (imageName) {
                const xpath = '//span[@class="badge badge-secondary"][text()="'+ imageName + '"]';
                elementToDelete.click();
                ImagesGridPage.clickDeleteButton();
                ImagesGridPage.clickCancelDeleteButton();
                browser.wait(EC.stalenessOf(ImagesGridPage.getDeleteConfirmationModal()), delays.ECWaitTime);
                browser.wait(EC.presenceOf(element(by.xpath(xpath))), delays.ECWaitTime)
            });
    });

    it('navigate from grid to view, and back to grid', () => {

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
});