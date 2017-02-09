var EC = protractor.ExpectedConditions;
var path = require('path');

var gridPage = require('./images-grid.page');
var viewPage = require('./images-view.page');

describe('image grid tests -- ', function(){

    beforeEach(function (done) {
        gridPage.get().then(function(){
            done();
        })
    });

    it('cells should be (de-)selectable.', function(done){
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
                    })
                    .then(function() {

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
                                        done();
                                    });
                            }
                        }
                    })

            });
    });

    it('all images should become deselected by clicking the appropriate button.', function() {
        gridPage.clickCell(0)
            .then(function(){
                expect(gridPage.getCell(0).getAttribute('class')).toMatch(gridPage.selectedClass);
                return gridPage.clickDeselectButton();
            })
            .then(function () {
                expect(gridPage.getCell(0).getAttribute('class')).not.toMatch(gridPage.selectedClass);
            });
    });

    it('user should be able to delete an image in the grid view.', function (done) {
        var elementToDelete = gridPage.getCell(0);

        gridPage.getCellImageName(0)
            .then(function (imageName) {
                var xpath = '//span[@class="tag tag-default"][text()="'+ imageName + '"]';
                elementToDelete.click()
                    .then(function() { return gridPage.clickDeleteButton() })
                    .then(function() { return gridPage.clickConfirmDeleteButton() })
                    .then(function() {
                        browser.wait(EC.stalenessOf(gridPage.getDeleteConfirmationModal()), 1000)
                            .then(function(){
                                browser.wait(EC.stalenessOf(element(by.xpath(xpath))), 1000)
                                    .then(function(){
                                        done();
                                    })
                            })
                    });
            });
    });

    it('user should be able to connect a resource with an image in the grid view', function (done) {
        var imageToConnect = gridPage.getCell(0);
        var resourceId = "o10";
        var resourceIdentifier = "ob10";

        imageToConnect.click()
            .then(function () { expect(imageToConnect.getAttribute('class')).toMatch(gridPage.selectedClass); })
            .then(function () { return gridPage.clickCreateRelationsButton() })
            .then(function () { return gridPage.typeInIdentifierInLinkModal(resourceIdentifier) })
            .then(function () { return gridPage.getSuggestedResourcesInLinkModalByIdentifier(resourceIdentifier).click() })
            .then(function () { 
                    var relationMarker = imageToConnect.all(by.id('related-resource-'+resourceId)).first();
                    expect(relationMarker.isPresent()).toBeTruthy();
                    done();
                });
    });

    it('user should be able to cancel an image delete in the modal.', function (done) {
        var elementToDelete = gridPage.getCell(0);

        gridPage.getCellImageName(0)
            .then(function (imageName) {
                var xpath = '//span[@class="tag tag-default"][text()="'+ imageName + '"]';
                elementToDelete.click()
                    .then(function() { return gridPage.clickDeleteButton()})
                    .then(function() { return gridPage.clickCancelDeleteButton()})
                    .then(function() {
                        browser.wait(EC.stalenessOf(gridPage.getDeleteConfirmationModal()), 1000).then(
                            function(){
                                browser.wait(EC.presenceOf(element(by.xpath(xpath))), 1000)
                                    .then(function(){
                                        done();
                                    })
                            }
                        )
                    });
            });
    });

    it('user should be able to navigate from grid to view, and back to grid.', function(done) {
        var xpath = '//h3[@class="fieldname"][text()="Dateiname"]/following-sibling::div[@class="fieldvalue"]';

        gridPage.getCellImageName(0).then(function(imageName){
            gridPage.doubleClickCell(0).then(function(){
                browser.wait(EC.presenceOf(viewPage.getDocumentCard()))
                    .then(function(){
                        expect(element(by.xpath(xpath)).getText())
                            .toEqual(imageName);

                        viewPage.clickBackToGridButton()
                            .then(function(){
                                browser.wait(EC.presenceOf(gridPage.getCell(0)), 5000).then(function(){
                                    expect(gridPage.getCellImageName(0)).toEqual(imageName);
                                    done();
                                });
                            });
                    });
            })



        });
    });

    it('image upload should create a JSON document, which in turn gets displayed in the grid.', function (done) {
        // image is already present in mediastore folder since uploading does not work in HttpMediastore
        var fileName = 'Aldrin_Apollo_11.jpg';
        var xpath = '//span[@class="tag tag-default"][text()="' + fileName + '"]';

        gridPage.clickUploadArea()
            .then(function() { return gridPage.uploadImage(path.resolve(__dirname, '../../test-data/' + fileName)); })
            .then(function() { return gridPage.chooseImageSubtype(0); })
            .then(function() {
                browser.wait(EC.presenceOf(element(by.xpath(xpath))), 10000).then(function(){
                    done();
                })
            })
    });
});