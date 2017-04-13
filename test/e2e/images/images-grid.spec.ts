import {browser,protractor,element,by} from 'protractor';

var path = require('path');

var EC = protractor.ExpectedConditions;
var delays = require('../config/delays');

var gridPage = require('./images-grid.page');
var viewPage = require('./images-view.page');



describe('image grid tests --', function(){

    beforeEach(function () {
        gridPage.get();
        browser.wait(EC.visibilityOf(element(by.id("idai-field-brand"))), delays.ECWaitTime);
    });

    it('cells should be (de-)selectable.', function(){
        gridPage.getAllCells().then(function(cells){
            var first = 0;
            var last = cells.length - 1;

            cells[first].click();
            expect(cells[first].getAttribute('class')).toMatch(gridPage.selectedClass);
            cells[first].click();
            expect(cells[first].getAttribute('class')).not.toMatch(gridPage.selectedClass);
            if (last != first)
            {
                cells[last].click();
                expect(cells[last].getAttribute('class')).toMatch(gridPage.selectedClass);
                cells[last].click();
                expect(cells[last].getAttribute('class')).not.toMatch(gridPage.selectedClass);

                if (last > 1) {
                    var middle = Math.floor(0.5 * (cells.length));
                    cells[middle].click();
                    expect(cells[middle].getAttribute('class')).toMatch(gridPage.selectedClass);
                    cells[middle].click();
                    expect(cells[middle].getAttribute('class')).not.toMatch(gridPage.selectedClass);
                }
            }
        });
    });

    it('all images should become deselected by clicking the appropriate button.', function() {
        gridPage.clickCell(0);
        expect(gridPage.getCell(0).getAttribute('class')).toMatch(gridPage.selectedClass);
        gridPage.clickDeselectButton();
        expect(gridPage.getCell(0).getAttribute('class')).not.toMatch(gridPage.selectedClass);
    });

    it('user should be able to delete an image in the grid view.', function () {
        gridPage.getCellImageName(0)
            .then(function (filename) {
                gridPage.getCell(0).click();
                gridPage.clickDeleteButton();
                gridPage.clickConfirmDeleteButton();
                browser.wait(EC.stalenessOf(gridPage.getDeleteConfirmationModal()), delays.ECWaitTime);
                browser.wait(EC.stalenessOf(gridPage.getCellFilenameElement(filename)), delays.ECWaitTime);
            });
    });

    it('user should be able to delete two images in the grid view.', function () {
        gridPage.getCellImageName(0)
            .then(function (image1filename) {
                gridPage.getCellImageName(1)
                    .then(function (image2filename) {
                        gridPage.getCell(0).click();
                        gridPage.getCell(1).click();
                        gridPage.clickDeleteButton();
                        gridPage.clickConfirmDeleteButton();
                        browser.wait(EC.stalenessOf(gridPage.getDeleteConfirmationModal()), delays.ECWaitTime);
                        browser.wait(EC.stalenessOf(gridPage.getCellFilenameElement(image1filename)), delays.ECWaitTime);
                        browser.wait(EC.stalenessOf(gridPage.getCellFilenameElement(image2filename)), delays.ECWaitTime);
                    })
            });
    });

    it('user should be able to connect a resource with an image in the grid view', function () {
        var imageToConnect = gridPage.getCell(0);
        var resourceId = "tf1";
        var resourceIdentifier = "testf1";

        imageToConnect.click();
        expect(imageToConnect.getAttribute('class')).toMatch(gridPage.selectedClass);
        gridPage.clickCreateRelationsButton();
        gridPage.typeInIdentifierInLinkModal(resourceIdentifier);
        gridPage.getSuggestedResourcesInLinkModalByIdentifier(resourceIdentifier).click();
        expect(imageToConnect.all(by.id('related-resource-'+resourceId)).first().isPresent()).toBeTruthy();
    });

    it('user should be able to cancel an image delete in the modal.', function () {
        var elementToDelete = gridPage.getCell(0);

        gridPage.getCellImageName(0)
            .then(function (imageName) {
                var xpath = '//span[@class="tag tag-default"][text()="'+ imageName + '"]';
                elementToDelete.click();
                gridPage.clickDeleteButton();
                gridPage.clickCancelDeleteButton();
                browser.wait(EC.stalenessOf(gridPage.getDeleteConfirmationModal()), delays.ECWaitTime);
                browser.wait(EC.presenceOf(element(by.xpath(xpath))), delays.ECWaitTime)
            });
    });

    it('user should be able to navigate from grid to view, and back to grid.', function() {
        var xpath = '//h3[@class="fieldname"][text()="Dateiname"]/following-sibling::div[@class="fieldvalue"]';

        gridPage.getCellImageName(0).then(function(imageName){
            gridPage.doubleClickCell(0);
            browser.wait(EC.presenceOf(viewPage.getDocumentCard()),delays.ECWaitTime);
            expect(element(by.xpath(xpath)).getText()).toEqual(imageName);

            viewPage.clickBackToGridButton();
            browser.wait(EC.presenceOf(gridPage.getCell(0)), delays.ECWaitTime);
            expect(gridPage.getCellImageName(0)).toEqual(imageName);
        });
    });

    xit('image upload should create a JSON document, which in turn gets displayed in the grid.', function () {
        // image is already present in mediastore folder since uploading does not work in HttpMediastore
        var fileName = 'Aldrin_Apollo_11.jpg';
        var xpath = '//span[@class="tag tag-default"][text()="' + fileName + '"]';

        gridPage.clickUploadArea();
        gridPage.uploadImage(path.resolve(__dirname, '../../test-data/' + fileName));
        gridPage.chooseImageSubtype(0);
        browser.wait(EC.presenceOf(element(by.xpath(xpath))), delays.ECWaitTime);
    });
});