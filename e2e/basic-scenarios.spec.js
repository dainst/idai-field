var common = require("./common.js");
var utils = require("./utils.js");

/*
 * In order to prevent errors caused by e2e tests running too fast you can slow them down by calling the following
 * function. Use higher values for slower tests.
 *
 * utils.delayPromises(50);
 *
 */

describe('idai field app', function() {

    function typeInIdentifierInSearchField() {
        return common.typeIn(element(by.id('object-search')), "12");
    }

    beforeEach(function(){
        browser.get('/');
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
            .then(common.switchToEditMode())
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
            .then(common.switchToEditMode())
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
            .then(common.clickCreateObjectButton)
            .then(function(){
                expect(element(by.id('object-overview-note-0')).getText()).toEqual("Neues Objekt");
            })
            .then(common.selectObject(1))
            .then(function(){
                expect(element(by.id('object-overview-identifier-0')).getText()).toEqual("1");
            })
    });
});