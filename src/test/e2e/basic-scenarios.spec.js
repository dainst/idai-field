describe('idai field app', function() {

    function createObject(fun) {
        element(by.id('object-overview-button-create-object')).click().then(function(){
            element(by.id('create-object-option-0')).click().then(function(){
                element(by.id('object-edit-input-identifier')).clear().sendKeys('1').sendKeys('2').then(function() {
                    element(by.id('object-edit-button-save-object')).click().then(function() {
                        fun();
                    })
                });
            });
        });
    }

    function createId() {
        element(by.id('object-edit-input-identifier')).clear().sendKeys('1').sendKeys('2').then(function() {
            element(by.id('object-edit-button-save-object')).click();
        });
    }

    beforeEach(function(){
        browser.get('/');
    });

    it('should create a new object of first listed type ', function() {
        createObject(function(){
            expect(element(by.id('object-overview-identifier-0')).getText()).toEqual("12");
        });
    });

    it('should warn if an existing id is used ', function() {
        createObject(function(){

            createObject(function() {
                expect(element(by.id('message-0')).getText()).
                    toEqual("Objekt Identifier existiert bereits. Bei Klick auf ein anderes Objekt wird der ursprüngliche Zustand wiederhergestellt.");
            });
        });
    });
});
