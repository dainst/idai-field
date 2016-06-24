var common = require("./common.js");

describe('idai field app', function() {

    function typeInIdentifierInSearchField() {
        return common.typeIn(element(by.id('object-search')), "12");
    }

    beforeEach(function(){
        browser.get('/');
    });

    it('should create a new object of first listed type ', function() {
        common.createObject("12")
            .then(function(){
                expect(element(by.id('object-overview-identifier-0')).getText()).toEqual("12");
            });
    });

    it('should warn if an existing id is used ', function() {
        common.createObject("12")
            .then(common.createObject("12"))
            .then(function(){
                expect(element(by.id('message-0')).getText()).
                    toEqual("Objekt-Identifier existiert bereits.");
            });
    });

    it('should find it by its identifier', function() {
        common.createObject("12")
            .then(typeInIdentifierInSearchField)
            .then(function(){
                expect(element(by.id('object-overview-identifier-0')).getText()).toEqual("12");
            });
    });
    
    it ('should reflect changes in overview in realtime while editing object identifier', function() {
        common.createObject("12")
            .then(common.selectObject(0))
            .then(common.typeInIdentifier("34"))
            .then(function(){
                expect(element(by.id('object-overview-identifier-0')).getText()).toEqual("34");
            });
    });

    /**
     * There has been a bug where this was not possible. 
     * The attempt to do so got rejected with the duplicate identifier message.
     */
    it ('should save a new object and then save it again', function() {
        common.createObject("1")
            .then(common.saveObject)
            .then(function(){
                expect(element(by.id('message-0')).getText()).
                toEqual("Das Objekt wurde erfolgreich gespeichert.");
            });
    });

    /**
     * There has been a bug where clicking the new button without doing anything
     * led to leftovers of "Neues Objekt" for every time the button was pressed.
     */
    it("should remove a new object from the list if it hasn't been saved", function() {
        common.createObject("1")
            .then(common.clickCreateObjectButton)
            .then(common.clickCreateObjectButton)
            .then(function(){
                expect(element(by.id('object-overview-note-0')).getText()).toEqual("Neues Objekt");
            })
            .then(common.selectObject(1))
            .then(function(){
                expect(element(by.id('object-overview-identifier-0')).getText()).toEqual("1");
            })
    });

    /**
     * There was a bug where the change after confirming "save" did not happen.
     */
    it ("should change the selection when saving via modal", function() {
        common.createObject("1")
            .then(common.selectObject(0))
            .then(common.typeInIdentifier("2"))
            .then(common.clickCreateObjectButton())
            .then(common.scrollUp)
            .then(clickSaveInModal)
            .then(common.scrollUp)
            .then(function(){
                expect(element(by.id('object-overview-note-0')).getText()).toEqual("Neues Objekt");
            })
    });

    /**
     * There was a bug where the change after confirming "save" did not happen.
     */
    fit ("should change the selection when saving via modal", function() {
        common.createObject("1")
            .then(common.createObject("2"))
            .then(common.selectObject(0))
            .then(common.typeInIdentifier("2a"))
            .then(common.selectObject(1))
            .then(common.scrollUp)
            .then(clickSaveInModal)
            .then(common.scrollUp)
            .then(function(){
                expect(element.all(by.css('.list-group-item')).get(1)
                    .getAttribute('class')).toMatch('list-group-item unsynced selected')
            })
    });

    function clickSaveInModal() {
        return element(by.id('overview-save-confirmation-modal-save-button')).click();
    }
});