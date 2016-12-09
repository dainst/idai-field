var resourcesPage = require('./resources.page');
var EC = protractor.ExpectedConditions;

describe('resources', function() {

    beforeEach(function(){
        resourcesPage.get();
    });

    it('should find it by its identifier', function() {
        resourcesPage.createResource('12')
            .then(resourcesPage.typeInIdentifierInSearchField('12'))
            .then(function(){
                browser.wait(EC.presenceOf(resourcesPage.getListItemByIdentifier('12')));
            });
    });

    it ('should show only resources of the selected type', function() {
        resourcesPage.createResource('1', 0)
            .then(resourcesPage.createResource('2', 1))
            .then(resourcesPage.setTypeFilter(2))
            .then(resourcesPage.setTypeFilter(1))
            .then(function() {
                browser.wait(EC.stalenessOf(resourcesPage.getListItemByIdentifier('1')), 1000);
                browser.wait(EC.presenceOf(resourcesPage.getListItemByIdentifier('2')), 1000);
            })
            .then(resourcesPage.setTypeFilter(0))
            .then(function() {
                browser.wait(EC.presenceOf(resourcesPage.getListItemByIdentifier('1')), 1000);
                browser.wait(EC.stalenessOf(resourcesPage.getListItemByIdentifier('2')), 1000);
            })
            .then(resourcesPage.setTypeFilter('all'))
            .then(function() {
                browser.wait(EC.presenceOf(resourcesPage.getListItemByIdentifier('1')), 1000);
                browser.wait(EC.presenceOf(resourcesPage.getListItemByIdentifier('2')), 1000);
            });
    });

    it ('should reflect changes in overview in realtime', function() {
        resourcesPage.createResource('1a')
            .then(resourcesPage.createResource('2'))
            .then(resourcesPage.selectObjectByIndex(1))
            .then(resourcesPage.clickEditDocument)
            .then(resourcesPage.typeInIdentifier('1b'))
            .then(function(){
                expect(browser.wait(EC.presenceOf(resourcesPage.getListItemByIdentifier('1b')), 1000));
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
        resourcesPage.createResource('12')
            .then(resourcesPage.typeInIdentifier('34'))
            .then(function(){
                expect(browser.wait(EC.presenceOf(resourcesPage.getListItemByIdentifier('34')), 1000));
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
    it('should remove a new object from the list if it has not been saved', function() {
        resourcesPage.createResource('1')
            .then(resourcesPage.clickCreateObject)
            .then(resourcesPage.selectResourceType)
            .then(resourcesPage.selectGeometryType)
            .then(resourcesPage.clickCreateObject)
            .then(resourcesPage.selectResourceType)
            .then(resourcesPage.selectGeometryType)
            .then(function(){
                return browser.wait(EC.presenceOf(resourcesPage.findListItemMarkedNew()), 1000);
            })
            .then(resourcesPage.scrollUp)
            .then(resourcesPage.selectObjectByIndex(1))
            .then(function(){
                expect(resourcesPage.getFirstListItemIdentifier()).toEqual('1');
            })
    });

    it ('should change the selection to new when saving via modal', function() {
        resourcesPage.createResource('1')
            .then(resourcesPage.selectObjectByIndex(0))
            .then(resourcesPage.clickEditDocument)
            .then(resourcesPage.typeInIdentifier('2'))
            .then(resourcesPage.clickCreateObject)
            .then(resourcesPage.selectResourceType)
            .then(resourcesPage.selectGeometryType)
            .then(resourcesPage.scrollUp)
            .then(resourcesPage.clickSaveInModal)
            .then(resourcesPage.scrollUp)
            .then(function(){
                expect(element(by.css('#objectList .list-group-item .new')).getText()).toEqual('Neues Objekt');
            })
    });

    it ('should change the selection to existing when saving via modal', function() {
        resourcesPage.createResource('1')
            .then(resourcesPage.createResource('2'))
            .then(resourcesPage.selectObjectByIndex(0))
            .then(resourcesPage.clickEditDocument)
            .then(resourcesPage.typeInIdentifier('2a'))
            .then(resourcesPage.selectObjectByIndex(1))
            .then(resourcesPage.scrollUp)
            .then(resourcesPage.clickSaveInModal)
            .then(resourcesPage.scrollUp)
            .then(function(){
                expect(resourcesPage.selectObjectByIndex(1).getAttribute('class')).toContain('selected')
            })
    });

    it ('should not change the selection to existing when cancelling in modal', function() {
        resourcesPage.createResource('1')
            .then(resourcesPage.createResource('2'))
            .then(resourcesPage.selectObjectByIndex(0))
            .then(resourcesPage.clickEditDocument)
            .then(resourcesPage.typeInIdentifier('2a'))
            .then(resourcesPage.selectObjectByIndex(1))
            .then(resourcesPage.scrollUp)
            .then(resourcesPage.clickCancelInModal)
            .then(resourcesPage.scrollUp)
            .then(function(){
                expect(resourcesPage.selectObjectByIndex(0).getAttribute('class')).toContain('selected')
            })
    });
});
