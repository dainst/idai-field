describe('idai field app', function(){

    beforeEach(function(){
        browser.get('/#/images');
    });

    it('image cells should be (de-)selectable', function(){
        element.all(by.css('.cell')).then(function(cells) {
            var first = 0;
            var last =  cells.length - 1;
            var random = Math.floor(Math.random() * last);

            cells[first].click().then(function(){
                expect(cells[first].getAttribute("class")).toMatch("selected");
            });

            cells[last].click().then(function(){
                expect(cells[last].getAttribute("class")).toMatch("selected");
            });

            cells[first].click().then(function(){
                expect(cells[first].getAttribute("class")).not.toMatch("selected");
            });

            cells[random].click().then(function(){
                expect(cells[random].getAttribute("class")).toMatch("selected");
            });

            cells[last].click().then(function(){
                expect(cells[last].getAttribute("class")).not.toMatch("selected");
            });

            cells[random].click().then(function(){
                expect(cells[random].getAttribute("class")).not.toMatch("selected");
            });
        });
    });
});