var common = require("../common.js");

describe('overview component', function() {

    beforeEach(function(){
        browser.get('/#/resources');
    });

    it('should find it by its identifier', function() {
        common.createObject("12")
            .then(typeInIdentifierInSearchField)
            .then(function(){
                expect(element(by.id('object-overview-identifier-0')).getText()).toEqual("12");
            });
    });

    it ('should reflect changes in overview in realtime', function() {
        common.createObject("1a")
            .then(common.createObject("2"))
            .then(common.selectObject(1))
            .then(common.switchToEditMode)
            .then(common.typeInIdentifier("1b"))
            .then(function(){
                expect(element(by.id('object-overview-identifier-1')).getText()).toEqual("1b");
            });
    });

    /**
     * There was a bug which caused that a freshly created object
     * was not the same instance in the document edit and the overview component anymore
     * so that changes made to one would not be reflected in the other.
     *
     * This however did not happen with an object already saved.
     */
    it ('should reflect changes in overview after creating object', function() {
        common.createObject("12")
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
                expect(element(by.id('message-0')).getText())
                    .toContain("erfolgreich");
            });
    });

    /**
     * There has been a bug where clicking the new button without doing anything
     * led to leftovers of "Neues Objekt" for every time the button was pressed.
     */
    it("should remove a new object from the list if it hasn't been saved", function() {
        common.createObject("1")
            .then(common.clickCreateObjectButton)
            .then(common.selectObjectType())
            .then(common.clickCreateObjectButton)
            .then(common.selectObjectType())
            .then(function(){
                expect(element(by.id('object-overview-note-0')).getText()).toEqual("Neues Objekt");
            })
            .then(common.selectObject(1))
            .then(function(){
                expect(element(by.id('object-overview-identifier-0')).getText()).toEqual("1");
            })
    });

    it ("should change the selection to new when saving via modal", function() {
        common.createObject("1")
            .then(common.selectObject(0))
            .then(common.switchToEditMode())
            .then(common.typeInIdentifier("2"))
            .then(common.clickCreateObjectButton())
            .then(common.selectObjectType())
            .then(common.scrollUp)
            .then(common.clickSaveInModal)
            .then(common.scrollUp)
            .then(function(){
                expect(element(by.id('object-overview-note-0')).getText()).toEqual("Neues Objekt");
            })
    });

    it ("should change the selection to existing when saving via modal", function() {
        common.createObject("1")
            .then(common.createObject("2"))
            .then(common.selectObject(0))
            .then(common.switchToEditMode())
            .then(common.typeInIdentifier("2a"))
            .then(common.selectObject(1))
            .then(common.scrollUp)
            .then(common.clickSaveInModal)
            .then(common.scrollUp)
            .then(function(){
                expect(element.all(by.css('#objectList .list-group-item')).get(1)
                    .getAttribute('class')).toContain('selected')
            })
    });

    it ("should not change the selection to existing when cancelling in modal", function() {
        common.createObject("1")
            .then(common.createObject("2"))
            .then(common.selectObject(0))
            .then(common.switchToEditMode())
            .then(common.typeInIdentifier("2a"))
            .then(common.selectObject(1))
            .then(common.scrollUp)
            .then(common.clickCancelInModal)
            .then(common.scrollUp)
            .then(function(){
                expect(element.all(by.css('#objectList .list-group-item')).get(0)
                    .getAttribute('class')).toContain('selected')
            })
    });

    function typeInIdentifierInSearchField() {
        return common.typeIn(element(by.id('object-search')), "12");
    }


});
