var EC = protractor.ExpectedConditions;
var path = require('path');

describe('image grid tests -- ', function(){

    beforeEach(function(){
        browser.get('/#/images');
        browser.wait(EC.presenceOf(element(by.css('.cell'))), 10000, 'Waiting for image cells.');
    });

    it('cells should be (de-)selectable.', function(){
        element.all(by.css('.cell')).then(function(cells) {
            var first = 0;
            var last = cells.length - 1;

            cells[first].click()
                .then(function() {
                    expect(cells[first].getAttribute('class')).toMatch('selected');
                    return cells[first].click();
                })
                .then(function() {
                    expect(cells[first].getAttribute('class')).not.toMatch('selected');
                });

            if (last != first)
            {
                cells[last].click()
                    .then(function() {
                        expect(cells[last].getAttribute('class')).toMatch('selected');
                        return cells[last].click();
                    })
                    .then(function() {
                        expect(cells[last].getAttribute('class')).not.toMatch('selected');
                    });

                if (last > 1) {
                    var middle = Math.floor(0.5 * (cells.length));

                    cells[middle].click()
                        .then(function() {
                            expect(cells[middle].getAttribute('class')).toMatch('selected');
                            return cells[middle].click();
                        })
                        .then(function() {
                            expect(cells[middle].getAttribute('class')).not.toMatch('selected');
                        });
                }
            }
        });
    });

    it('all images should become deselected by clicking the appropriate button.', function() {
        var cell = element.all(by.css('.cell')).first();
        cell.click().then(function(){
            expect(cell.getAttribute('class')).toMatch('selected');
            element(by.id('deselect-images')).click().then(function(){
                expect(cell.getAttribute('class')).not.toMatch('selected');
            });
        });
    });

    it('user should be able to delete an image in the grid view.', function () {

        var elementToDelete = element.all(by.css('.cell')).first();

        elementToDelete.element(by.css('.tag.tag-default')).getText()
            .then(function (imageName) {
                var xpath = '//span[@class="tag tag-default"][text()="'+ imageName + '"]';
                elementToDelete.click()
            .then(function() { element(by.id('delete-images')).click() })
            .then(function() { element(by.id('delete-images-confirm')).click() })
            .then(function() {
                browser.wait(EC.stalenessOf(element(by.css('.modal-dialog'))), 1000);
                browser.wait(EC.stalenessOf(element(by.xpath(xpath))), 1000);
            });
        });
    });

    it('user should be able to cancel an image delete in the modal.', function () {
        var elementToDelete = element.all(by.css('.cell')).first();

        elementToDelete.element(by.css('.tag.tag-default')).getText()
            .then(function (imageName) {
                var xpath = '//span[@class="tag tag-default"][text()="'+ imageName + '"]';
                elementToDelete.click()
                    .then(function() { element(by.id('delete-images')).click() })
                    .then(function() { element(by.id('delete-images-cancel')).click() })
                    .then(function() {
                        browser.wait(EC.stalenessOf(element(by.css('.modal-dialog'))), 1000);
                        browser.wait(EC.presenceOf(element(by.xpath(xpath))), 1000);
                    });
            });
    });

    it('user should be able to navigate from grid to view, and back to grid.', function() {
        var xpath = '//div[@class="fieldname"][text()="filename"]/following-sibling::div[@class="fieldvalue"]';
        var originalCell = element.all(by.css('.cell')).first();

        originalCell.element(by.css('.tag.tag-default')).getText().then(function(initialId){
            browser.actions().doubleClick(originalCell).perform();
            browser.wait(EC.presenceOf(element(by.id('document-view'))));

            expect(element(by.xpath(xpath)).getText())
                .toEqual(initialId);

            var backButton = element(by.id('document-view-button-back-to-map'));

            backButton.click().then(function(){
                browser.wait(EC.presenceOf(element.all(by.css('.cell')).first()), 1000);

                expect(element.all(by.css('.cell')).first().element(by.css('.tag.tag-default')).getText())
                    .toEqual(initialId)
            });
        });
    });

    it('image upload should create a JSON document, which in turn gets displayed in the grid.', function () {
        // image is already present in mediastore folder since uploading does not work in HttpMediastore
        var fileName = 'Aldrin_Apollo_11.jpg';
        var xpath = '//span[@class="tag tag-default"][text()="' + fileName + '"]';

        element(by.id('file')).sendKeys(path.resolve(__dirname, '../../test-data/' + fileName))
            .then(function() { element(by.css('.droparea')).click() })
            .then(function () {
                expect(element(by.xpath(xpath)).isPresent()).toBe(true);
            })
    });
});