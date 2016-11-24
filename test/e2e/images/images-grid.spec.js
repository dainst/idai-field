var EC = protractor.ExpectedConditions;

describe('image grid tests', function(){

    beforeEach(function(){
        browser.get('/#/images');
        browser.wait(EC.presenceOf(element(by.css('.cell'))), 10000, 'Waiting for image cells.');
    });

    it('image cells should be (de-)selectable', function(){
        element.all(by.css('.cell')).then(function(cells) {
            var first = 0;
            var last =  cells.length - 1;
            var random = Math.floor(Math.random() * last);

            cells[first].click().then(function(){
                expect(cells[first].getAttribute('class')).toMatch('selected');
            });

            cells[first].click().then(function(){
                expect(cells[first].getAttribute('class')).not.toMatch('selected');
            });

            cells[last].click().then(function(){
                expect(cells[last].getAttribute('class')).toMatch('selected');
            });

            cells[last].click().then(function(){
                expect(cells[last].getAttribute('class')).not.toMatch('selected');
            });

            cells[random].click().then(function(){
                expect(cells[random].getAttribute('class')).toMatch('selected');
            });

            cells[random].click().then(function(){
                expect(cells[random].getAttribute('class')).not.toMatch('selected');
            });
        });
    });

    it('deselecting all images by clicking appropriate button', function() {
        var cell = element.all(by.css('.cell')).first();
        cell.click().then(function(){
            expect(cell.getAttribute('class')).toMatch('selected');
            element(by.id('deselect-images')).click().then(function(){
                expect(cell.getAttribute('class')).not.toMatch('selected');
            });
        });
    });

    it('testing navigation grid -> single view -> grid', function() {
        var xpath = '//div[@class="fieldname"][text()="filename"]/following-sibling::div[@class="fieldvalue"]';
        var originalCell = element.all(by.css('.cell')).first();

        originalCell.element(by.css('.tag.tag-default')).getText().then(function(initialId){
            browser.actions().doubleClick(originalCell).perform();
            browser.wait(EC.presenceOf(element(by.id('document-view'))));

            expect(element(by.xpath(xpath)).getText())
                .toEqual(initialId);

            var backButton = element(by.id('document-view-button-back-to-map'));

            backButton.click().then(function(){
                browser.wait(EC.presenceOf(element.all(by.css('.cell')).first()));

                expect(element.all(by.css('.cell')).first().element(by.css('.tag.tag-default')).getText())
                    .toEqual(initialId)
            });
        });
    });
});