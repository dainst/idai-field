var common = require("./common.js");

describe('overview component', function() {
    
    it ("should change the selection to new when saving via modal", function() {
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

    it ("should change the selection to existing when saving via modal", function() {
        common.createObject("1")
            .then(common.createObject("2"))
            .then(common.selectObject(0))
            .then(common.typeInIdentifier("2a"))
            .then(common.selectObject(1))
            .then(common.scrollUp)
            .then(clickSaveInModal)
            .then(common.scrollUp)
            .then(function(){
                expect(element.all(by.css('#objectList .list-group-item')).get(1)
                    .getAttribute('class')).toContain('selected')
            })
    });

    
    
    
    // TODO write test that prevents change of selection if the save was confirmed
    // via modal but there was an error. 
    
    
    
    function clickSaveInModal() {
        return element(by.id('overview-save-confirmation-modal-save-button')).click();
    }
});