var common = require("../common.js");
var utils = require("../utils.js");

/*
 * In order to prevent errors caused by e2e tests running too fast you can slow them down by calling the following
 * function. Use higher values for slower tests.
 *
 * utils.delayPromises(50);
 *
 */
describe('relations', function() {

    function addRelation() {
        return element.all(by.tagName('relation-picker-group')).first()
            .element(by.css('.circular-button.add-relation')).click();
    }

    function getFirstRelationOfGroup(groupIndex) {
        return element.all(by.tagName('relation-picker-group')).get(groupIndex)
            .all(by.tagName('relation-picker')).first();
    }

    function getSuggestion(relation, index) {
        return relation.all(by.css('.suggestion')).get(index);
    }    

    function getRelationButton(relation, index) {
        return relation.all(by.tagName('button')).get(index);
    }

    beforeEach(function() {
        browser.get('/#/resources/');
    });

    it ('should create links for relations', function() {
        common.createObject("o1")
            .then(common.createObject("o2"))
            .then(common.scrollDown)
            .then(addRelation)
            .then(function(){
                return common.typeIn(getFirstRelationOfGroup(0).element(by.tagName("input")), "o1");
            })
            .then(function() {
                return getSuggestion(getFirstRelationOfGroup(0), 0).click();
            })
            .then(common.scrollUp)
            .then(common.saveObject)
            .then(common.selectObject(1))
            .then(function(){
                expect(element(by.css('#document-view a')).getText())
                    .toContain("o2");
                return element(by.css('#document-view a')).click();
            })
            .then(function(){
                expect(element(by.css('#document-view a')).getText())
                    .toContain("o1");
            })
    });


    it('should create a new relation and the corresponding inverse relation', function() {
        // expect(getFirstRelationOfGroup(0).isPresent()).toBe(false); known not to work on ci

        common.createObject("o1")
            .then(common.createObject("o2"))
            .then(common.scrollDown)
            .then(addRelation)

            .then(function() {
                expect(getFirstRelationOfGroup(0).isPresent()).toBe(true);
                // expect(getSuggestion(getFirstRelationOfGroup(0), 0).isPresent()).toBe(false); known not to work on ci
                return common.typeIn(getFirstRelationOfGroup(0).element(by.tagName("input")), "o1");
            })
            .then(function() {
                expect(getSuggestion(getFirstRelationOfGroup(0), 0).isPresent()).toBe(true);
                return getSuggestion(getFirstRelationOfGroup(0), 0).click();
            })
            .then(function() {
                expect(getRelationButton(getFirstRelationOfGroup(0), 0).isPresent()).toBe(true);
                expect(getRelationButton(getFirstRelationOfGroup(0), 0).element(by.tagName("span")).getText())
                    .toEqual("o1");
                
                
                return common.scrollUp().then(common.saveObject);
            })
            .then(common.selectObject(1))
            .then(common.switchToEditMode())
            .then(function() {
                expect(getFirstRelationOfGroup(1).isPresent()).toBe(true);
                expect(getRelationButton(getFirstRelationOfGroup(1), 0).isPresent()).toBe(true);
                expect(getRelationButton(getFirstRelationOfGroup(1), 0).element(by.tagName("span")).getText())
                    .toEqual("o2");
            });
    });

});
