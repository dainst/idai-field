describe('idai field app', function() {

    function createObject() {

        return clickCreateObject()
                .then(selectTypeObject)
                .then(typeInIdentifier)
                .then(saveObject);
    }


    function clickCreateObject() {
        return element(by.id('object-overview-button-create-object')).click()
    }

    function selectTypeObject() {
        return element(by.id('create-object-option-0')).click();
    }

    function typeInIdentifier() {
        return element(by.id('object-edit-input-identifier')).clear().sendKeys('1').sendKeys('2');
    }

    function typeInIdentifierInSearchField() {
        return element(by.id('object-search')).clear().sendKeys('1').sendKeys('2');
    }

    function saveObject() {
        return element(by.id('object-edit-button-save-object')).click();
    }

    beforeEach(function(){
        browser.get('/');
    });

    it('should create a new object of first listed type ', function() {
        createObject()
            .then(function(){
                expect(element(by.id('object-overview-identifier-0')).getText()).toEqual("12");
            });
    });

    it('should warn if an existing id is used ', function() {
        createObject()
            .then(createObject)
            .then(function(){
                expect(element(by.id('message-0')).getText()).
                    toEqual("Objekt Identifier existiert bereits. Bei Klick auf ein anderes Objekt wird der ursprüngliche Zustand wiederhergestellt.");
            });
    });

    it('should find it by its identifier', function() {
        createObject()
            .then(typeInIdentifierInSearchField)
            .then(function(){
                expect(element(by.id('object-overview-identifier-0')).getText()).toEqual("12");
            });
    });
});
