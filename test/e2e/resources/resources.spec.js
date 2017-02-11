var resourcesPage = require('./resources.page');
var EC = protractor.ExpectedConditions;
var delays = require('../config/delays');


/**
 * @author Daniel de Oliveira
 */
describe('resources', function() {


    beforeEach(function(){
        resourcesPage.get();
    });

    it('should find it by its identifier', function() {
        resourcesPage.createResource('1');
        resourcesPage.typeInIdentifierInSearchField('1');
        browser.wait(EC.presenceOf(resourcesPage.getListItemByIdentifier('1')),delays.ECWaitTime);
    });

    it ('should show only resources of the selected type', function() {
        resourcesPage.createResource('1', 0);
        resourcesPage.createResource('2', 1);
        resourcesPage.setTypeFilter(2);
        resourcesPage.setTypeFilter(1);
        browser.wait(EC.stalenessOf(resourcesPage.getListItemByIdentifier('1')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(resourcesPage.getListItemByIdentifier('2')), delays.ECWaitTime);
        resourcesPage.setTypeFilter(0);
        browser.wait(EC.presenceOf(resourcesPage.getListItemByIdentifier('1')), delays.ECWaitTime);
        browser.wait(EC.stalenessOf(resourcesPage.getListItemByIdentifier('2')), delays.ECWaitTime);
        resourcesPage.setTypeFilter('all');
        browser.wait(EC.presenceOf(resourcesPage.getListItemByIdentifier('1')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(resourcesPage.getListItemByIdentifier('2')), delays.ECWaitTime)
    });

    it ('should reflect changes in overview in realtime', function() {
        resourcesPage.createResource('1a');
        resourcesPage.createResource('2');
        resourcesPage.selectObjectByIndex(1);
        resourcesPage.clickEditDocument();
        resourcesPage.typeInIdentifier('1b');
        browser.wait(EC.presenceOf(resourcesPage.getListItemByIdentifier('1b')), delays.ECWaitTime);
    });

    /**
     * Addresses a bug which caused that a freshly created object
     * was not the same instance in the document edit and the overview component anymore
     * so that changes made to one would not be reflected in the other.
     *
     * This however did not happen with an object already saved.
     */
    it ('should reflect changes in overview after creating object', function() {
        resourcesPage.createResource('12');
        resourcesPage.typeInIdentifier('34');
        browser.wait(EC.presenceOf(resourcesPage.getListItemByIdentifier('34')), delays.ECWaitTime);
    });


    /**
     * Addresses a bug where a call on datastore.find led to detached documents in the resource overview.
     * The instances didn't reflect the state of the db and vice versa because they were different instances.
     */
    it ('should reflect changes in overview after creating object', function() {
        resourcesPage.createResource('12');
        resourcesPage.setTypeFilter(0); // calls find
        resourcesPage.selectObjectByIndex(0);
        resourcesPage.clickEditDocument();
        resourcesPage.typeInIdentifier('56'); // same ...
        browser.wait(EC.presenceOf(resourcesPage.getListItemByIdentifier('56')), delays.ECWaitTime); // ... instance
    });


    /**
     * There has been a bug where this was not possible.
     * The attempt to do so got rejected with the duplicate identifier message.
     */
    it ('should save a new object and then save it again', function() {
        resourcesPage.createResource('1');
        resourcesPage.clickSaveDocument();
        expect(resourcesPage.getMessage()).toContain('erfolgreich');
    });

    /**
     * There has been a bug where clicking the new button without doing anything
     * led to leftovers of 'Neues Objekt' for every time the button was pressed.
     */
    it('should remove a new object from the list if it has not been saved', function() {
        resourcesPage.createResource('1');
        resourcesPage.clickCreateObject();
        resourcesPage.selectResourceType();
        resourcesPage.selectGeometryType();
        resourcesPage.clickCreateObject();
        resourcesPage.selectResourceType();
        resourcesPage.selectGeometryType();
        browser.wait(EC.presenceOf(resourcesPage.findListItemMarkedNew()), delays.ECWaitTime);
        resourcesPage.scrollUp();
        resourcesPage.selectObjectByIndex(1);
        expect(resourcesPage.getFirstListItemIdentifier()).toEqual('1');
    });

    it ('should change the selection to new when saving via modal', function() {
        resourcesPage.createResource('1');
        resourcesPage.selectObjectByIndex(0);
        resourcesPage.clickEditDocument();
        resourcesPage.typeInIdentifier('2');
        resourcesPage.clickCreateObject();
        resourcesPage.selectResourceType();
        resourcesPage.selectGeometryType();
        resourcesPage.scrollUp();
        resourcesPage.clickSaveInModal();
        resourcesPage.scrollUp();
        browser.wait(EC.presenceOf(element(by.css('#objectList .list-group-item .new'))), delays.ECWaitTime);
        expect(element(by.css('#objectList .list-group-item .new')).getText()).toEqual('Neues Objekt');
    });

    it ('should change the selection to existing when saving via modal', function() {
        resourcesPage.createResource('1');
        resourcesPage.createResource('2');
        resourcesPage.selectObjectByIndex(0);
        resourcesPage.clickEditDocument();
        resourcesPage.typeInIdentifier('2a');
        resourcesPage.selectObjectByIndex(1);
        resourcesPage.scrollUp();
        resourcesPage.clickSaveInModal();
        resourcesPage.scrollUp();
        expect(resourcesPage.selectObjectByIndex(1).getAttribute('class')).toContain('selected')
    });

    it ('should not change the selection to existing when cancelling in modal', function() {
        resourcesPage.createResource('1');
        resourcesPage.createResource('2');
        resourcesPage.selectObjectByIndex(0);
        resourcesPage.clickEditDocument();
        resourcesPage.typeInIdentifier('2a');
        resourcesPage.selectObjectByIndex(1);
        resourcesPage.scrollUp();
        resourcesPage.clickCancelInModal();
        resourcesPage.scrollUp();
        expect(resourcesPage.selectObjectByIndex(0).getAttribute('class')).toContain('selected');
    });
});
