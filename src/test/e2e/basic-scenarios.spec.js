describe('idai field app', function() {

    function createObject(fun) {
        element(by.id('object-overview-button-create-object')).click().then(function(){
            element(by.id('create-object-option-0')).click().then(function(){
                fun();
            });
        });
    }

    function createId() {
        element(by.id('object-edit-input-identifier')).clear().sendKeys('1').sendKeys('2').sendKeys('3').sendKeys('4').sendKeys('5');
    }

    it('should create a new object of first listed type ', function() {
        browser.get('/');

        createObject(function(){
            createId();
            expect(element(by.id('object-overview-identifier-0')).getText()).toEqual("12345");
        });
    });

    it('should warn if an existing id is used ', function() {
        browser.get('/');

        createObject(function(){

            createId();
            createObject(function() {
                createId();
                expect(element(by.id('message-0')).getText()).
                    toEqual("Objekt Identifier existiert bereits. Bei Klick auf ein anderes Objekt wird der ursprüngliche Zustand wiederhergestellt.");
            });
        });
    });
});
