var EC = protractor.ExpectedConditions;
var path = require('path');

var gridPage = require('./images-grid.page');
var viewPage = require('./images-view.page');

describe('image grid tests -- ', function(){
    beforeEach(function () {
        gridPage.get();
    });

    it('cells should be (de-)selectable.', function(){
        gridPage.getAllCells()
            .then(function(cells) {
                var first = 0;
                var last = cells.length - 1;

                cells[first].click()
                    .then(function() {
                        expect(cells[first].getAttribute('class')).toMatch(gridPage.selectedClass);
                        return cells[first].click();
                    })
                    .then(function() {
                        expect(cells[first].getAttribute('class')).not.toMatch(gridPage.selectedClass);
                    });

                if (last != first)
                {
                    cells[last].click()
                        .then(function() {
                            expect(cells[last].getAttribute('class')).toMatch(gridPage.selectedClass);
                            return cells[last].click();
                        })
                        .then(function() {
                            expect(cells[last].getAttribute('class')).not.toMatch(gridPage.selectedClass);
                        });

                    if (last > 1) {
                        var middle = Math.floor(0.5 * (cells.length));

                        cells[middle].click()
                            .then(function() {
                                expect(cells[middle].getAttribute('class')).toMatch(gridPage.selectedClass);
                                return cells[middle].click();
                            })
                            .then(function() {
                                expect(cells[middle].getAttribute('class')).not.toMatch(gridPage.selectedClass);
                            });
                    }
                }
            });
    });

    it('all images should become deselected by clicking the appropriate button.', function() {
        gridPage.clickCell(0)
            .then(function(){
                expect(gridPage.getCell(0).getAttribute('class')).toMatch(gridPage.selectedClass);
                gridPage.clickDeselectButton();
            })
            .then(function () {
                expect(gridPage.getCell(0).getAttribute('class')).not.toMatch(gridPage.selectedClass);
            });
    });

    it('user should be able to delete an image in the grid view.', function () {
        var elementToDelete = gridPage.getCell(0);

        gridPage.getCellImageName(0)
            .then(function (imageName) {
                var xpath = '//span[@class="tag tag-default"][text()="'+ imageName + '"]';
                elementToDelete.click()
                    .then(function() { gridPage.clickDeleteButton() })
                    .then(function() { gridPage.clickConfirmDeleteButton() })
                    .then(function() {
                        browser.wait(EC.stalenessOf(gridPage.getDeleteConfirmationModal()), 1000);
                        browser.wait(EC.stalenessOf(element(by.xpath(xpath))), 1000);
                    });
            });
    });

    it('user should be able to cancel an image delete in the modal.', function () {
        var elementToDelete = gridPage.getCell(0);

        gridPage.getCellImageName(0)
            .then(function (imageName) {
                var xpath = '//span[@class="tag tag-default"][text()="'+ imageName + '"]';
                elementToDelete.click()
                    .then(function() { gridPage.clickDeleteButton() })
                    .then(function() { gridPage.clickCancelDeleteButton() })
                    .then(function() {
                        browser.wait(EC.stalenessOf(gridPage.getDeleteConfirmationModal()), 1000);
                        browser.wait(EC.presenceOf(element(by.xpath(xpath))), 1000);
                    });
            });
    });

    it('user should be able to navigate from grid to view, and back to grid.', function() {
        var xpath = '//div[@class="fieldname"][text()="Dateiname"]/following-sibling::div[@class="fieldvalue"]';

        gridPage.getCellImageName(0).then(function(imageName){
            gridPage.doubleClickCell(0);

            browser.wait(EC.presenceOf(viewPage.getDocumentCard()));

            expect(element(by.xpath(xpath)).getText())
                .toEqual(imageName);

            viewPage.clickBackToGridButton()
            .then(function(){
                browser.wait(EC.presenceOf(gridPage.getCell(0)), 1000);
                expect(gridPage.getCellImageName(0)).toEqual(imageName)
            });
        });
    });

    it('image upload should create a JSON document, which in turn gets displayed in the grid.', function () {
        // image is already present in mediastore folder since uploading does not work in HttpMediastore
        var fileName = 'Aldrin_Apollo_11.jpg';
        var xpath = '//span[@class="tag tag-default"][text()="' + fileName + '"]';

        gridPage.clickUploadArea()
            .then(function () { gridPage.uploadImage(path.resolve(__dirname, '../../test-data/' + fileName)) })
            .then(function () {
                browser.wait(EC.presenceOf(element(by.xpath(xpath))), 10000);
            })
    });
});