describe('relations', function() {

    function createObject(identifier) {

        return clickCreateObject()
                .then(selectTypeObject)
                .then(typeInIdentifier(identifier))
                .then(saveObject);
    }

    function clickCreateObject() {
        return element(by.id('object-overview-button-create-object')).click()
    }

    function selectTypeObject() {
        return element(by.id('create-object-option-0')).click();
    }

    function typeInIdentifier(identifier) {
        var inputField = element(by.id('object-edit-input-identifier'));
        return typeIn(inputField, identifier);
    }

    function typeIn(inputField, text) {
        inputField.clear();
        for (var i in text) {
            inputField.sendKeys(text[i]);
        }
        return inputField;
    }

    function saveObject() {
        return element(by.id('object-edit-button-save-object')).click();
    }

    function selectObject(listIndex) {
        return element(by.id('objectList')).all(by.tagName('li')).get(listIndex).click();
    }

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

    beforeEach(function(){
        browser.get('/');
    });

    it('should create a new relation and the corresponding inverse relation', function() {
        expect(getFirstRelationOfGroup(0).isPresent()).toBe(false);

        createObject("o1")
            .then(createObject("o2"))
            .then(addRelation)
            .then(function() {
                expect(getFirstRelationOfGroup(0).isPresent()).toBe(true);
                expect(getSuggestion(getFirstRelationOfGroup(0), 0).isPresent()).toBe(false);
                return typeIn(getFirstRelationOfGroup(0).element(by.tagName("input")), "o1");
            })
            .then(function() {
                expect(getSuggestion(getFirstRelationOfGroup(0), 0).isPresent()).toBe(true);
                return getSuggestion(getFirstRelationOfGroup(0), 0).click();
            })
            .then(function() {
                expect(getRelationButton(getFirstRelationOfGroup(0), 0).isPresent()).toBe(true);
                expect(getRelationButton(getFirstRelationOfGroup(0), 0).element(by.tagName("span")).getText())
                    .toEqual("o1");
                return saveObject();
            })
            .then(selectObject(1))
            .then(function() {
                expect(getFirstRelationOfGroup(1).isPresent()).toBe(true);
                expect(getRelationButton(getFirstRelationOfGroup(1), 0).isPresent()).toBe(true);
                expect(getRelationButton(getFirstRelationOfGroup(1), 0).element(by.tagName("span")).getText())
                    .toEqual("o2");
            });
    });

});
