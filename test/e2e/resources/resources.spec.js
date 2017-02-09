var resourcesPage = require('./resources.page');
var EC = protractor.ExpectedConditions;

var waitingTime = 2000;


/**
 * @author Daniel de Oliveira
 */
describe('resources', function() {


    beforeEach(function(done){
        resourcesPage.get().then(function(){
            done();
        })
    });

    it('should find it by its identifier', function(done) {
        resourcesPage.createResource('12')
            .then(function(){return resourcesPage.typeInIdentifierInSearchField('12')})
            .then(function(){
                browser.wait(EC.presenceOf(resourcesPage.getListItemByIdentifier('12'))).then(
                    function() {
                        done();
                    }
                )
            });
    });

    it ('should show only resources of the selected type', function(done) {
        resourcesPage.createResource('1', 0)
            .then(function(){return resourcesPage.createResource('2', 1)})
            .then(function(){return resourcesPage.setTypeFilter(2)})
            .then(function(){return resourcesPage.setTypeFilter(1)})
            .then(function() {
                return browser.wait(EC.stalenessOf(resourcesPage.getListItemByIdentifier('1')), waitingTime)
                    .then(function() {
                        return browser.wait(EC.presenceOf(resourcesPage.getListItemByIdentifier('2')), waitingTime);
                    })
            })
            .then(function(){resourcesPage.setTypeFilter(0)})
            .then(function() {
                return browser.wait(EC.presenceOf(resourcesPage.getListItemByIdentifier('1')), waitingTime)
                    .then(function(){
                        return browser.wait(EC.stalenessOf(resourcesPage.getListItemByIdentifier('2')), waitingTime);
                    })
            })
            .then(resourcesPage.setTypeFilter('all'))
            .then(function() {
                browser.wait(EC.presenceOf(resourcesPage.getListItemByIdentifier('1')), waitingTime)
                    .then(function(){
                        browser.wait(EC.presenceOf(resourcesPage.getListItemByIdentifier('2')), waitingTime)
                            .then(function(){
                                done()
                            })
                    })
            });
    });

    it ('should reflect changes in overview in realtime', function(done) {
        resourcesPage.createResource('1a')
            .then(function(){return resourcesPage.createResource('2')})
            .then(function(){return resourcesPage.selectObjectByIndex(1)})
            .then(resourcesPage.clickEditDocument)
            .then(function(){return resourcesPage.typeInIdentifier('1b')})
            .then(function(){
                expect(browser.wait(EC.presenceOf(resourcesPage.getListItemByIdentifier('1b')), waitingTime));
                done();
            });
    });

    /**
     * Addresses a bug which caused that a freshly created object
     * was not the same instance in the document edit and the overview component anymore
     * so that changes made to one would not be reflected in the other.
     *
     * This however did not happen with an object already saved.
     */
    it ('should reflect changes in overview after creating object', function(done) {
        resourcesPage.createResource('12')
            .then(function(){return resourcesPage.typeInIdentifier('34')})
            .then(function(){
                browser.wait(EC.presenceOf(resourcesPage.getListItemByIdentifier('34')), waitingTime)
                    .then(function(){
                        done();
                    })
            });
    });


    /**
     * Addresses a bug where a call on datastore.find led to detached documents in the resource overview.
     * The instances didn't reflect the state of the db and vice versa because they were different instances.
     */
    it ('should reflect changes in overview after creating object', function(done) {
        resourcesPage.createResource('12')
            .then(function(){return resourcesPage.setTypeFilter(0)}) // calls find
            .then(function(){return resourcesPage.selectObjectByIndex(0)})
            .then(resourcesPage.clickEditDocument)
            .then(function(){return resourcesPage.typeInIdentifier('56')}) // same ...
            .then(function(){
                browser.wait(EC.presenceOf(resourcesPage.getListItemByIdentifier('56')), waitingTime) // ... instance
                    .then(function(){
                        done();
                    });
            });
    });


    /**
     * There has been a bug where this was not possible.
     * The attempt to do so got rejected with the duplicate identifier message.
     */
    it ('should save a new object and then save it again', function() {
        resourcesPage.createResource('1')
            .then(resourcesPage.clickSaveDocument)
            .then(function(){
                expect(resourcesPage.getMessage()).toContain('erfolgreich');
            });
    });

    /**
     * There has been a bug where clicking the new button without doing anything
     * led to leftovers of 'Neues Objekt' for every time the button was pressed.
     */
    it('should remove a new object from the list if it has not been saved', function(done) {
        resourcesPage.createResource('1')
            .then(resourcesPage.clickCreateObject)
            .then(resourcesPage.selectResourceType)
            .then(resourcesPage.selectGeometryType)
            .then(resourcesPage.clickCreateObject)
            .then(resourcesPage.selectResourceType)
            .then(resourcesPage.selectGeometryType)
            .then(function(){
                return browser.wait(EC.presenceOf(resourcesPage.findListItemMarkedNew()), waitingTime);
            })
            .then(resourcesPage.scrollUp)
            .then(function(){return resourcesPage.selectObjectByIndex(1)})
            .then(function(){
                expect(resourcesPage.getFirstListItemIdentifier()).toEqual('1');
                done()
            })
    });

    it ('should change the selection to new when saving via modal', function(done) {
        resourcesPage.createResource('1')
            .then(function(){return resourcesPage.selectObjectByIndex(0)})
            .then(resourcesPage.clickEditDocument)
            .then(function(){return resourcesPage.typeInIdentifier('2')})
            .then(resourcesPage.clickCreateObject)
            .then(resourcesPage.selectResourceType)
            .then(resourcesPage.selectGeometryType)
            .then(resourcesPage.scrollUp)
            .then(resourcesPage.clickSaveInModal)
            .then(resourcesPage.scrollUp)
            .then(function(){
                expect(element(by.css('#objectList .list-group-item .new')).getText()).toEqual('Neues Objekt');
                done();
            })
    });

    it ('should change the selection to existing when saving via modal', function(done) {
        resourcesPage.createResource('1')
            .then(function(){return resourcesPage.createResource('2')})
            .then(function(){return resourcesPage.selectObjectByIndex(0)})
            .then(resourcesPage.clickEditDocument)
            .then(function(){return resourcesPage.typeInIdentifier('2a')})
            .then(function(){return resourcesPage.selectObjectByIndex(1)})
            .then(resourcesPage.scrollUp)
            .then(resourcesPage.clickSaveInModal)
            .then(resourcesPage.scrollUp)
            .then(function(){
                expect(resourcesPage.selectObjectByIndex(1).getAttribute('class')).toContain('selected')
                done();
            })
    });

    it ('should not change the selection to existing when cancelling in modal', function(done) {
        resourcesPage.createResource('1')
            .then(function(){return resourcesPage.createResource('2')})
            .then(function(){return resourcesPage.selectObjectByIndex(0)})
            .then(resourcesPage.clickEditDocument)
            .then(function(){return resourcesPage.typeInIdentifier('2a')})
            .then(function(){return resourcesPage.selectObjectByIndex(1)})
            .then(resourcesPage.scrollUp)
            .then(resourcesPage.clickCancelInModal)
            .then(resourcesPage.scrollUp)
            .then(function(){
                expect(resourcesPage.selectObjectByIndex(0).getAttribute('class')).toContain('selected')
                done();
            })
    });
});
