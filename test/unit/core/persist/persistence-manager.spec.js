"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var configuration_1 = require("idai-components-2/configuration");
var persistence_manager_1 = require("../../../../app/core/persist/persistence-manager");
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('PersistenceManager', function () {
    var projectConfiguration = new configuration_1.ProjectConfiguration({
        'types': [],
        'relations': [
            {
                'name': 'BelongsTo',
                'inverse': 'Contains',
                'label': 'Enthalten in'
            },
            {
                'name': 'Contains',
                'inverse': 'BelongsTo',
                'label': 'Enthält'
            },
            {
                'name': 'isRecordedIn',
                'label': 'Gehört zu'
            }
        ]
    });
    var mockDatastore;
    var persistenceManager;
    var id = 'abc';
    var doc;
    var relatedDoc;
    var anotherRelatedDoc;
    var findResult;
    var getFunction = function (id) {
        return new Promise(function (resolve) {
            if (id == relatedDoc['resource']['id']) {
                resolve(relatedDoc);
            }
            else {
                resolve(anotherRelatedDoc);
            }
        });
    };
    var findFunction = function () {
        return new Promise(function (resolve) {
            var findResultCopy = findResult;
            findResult = [];
            resolve({ documents: findResultCopy });
        });
    };
    var successFunction = function () {
        return Promise.resolve('ok');
    };
    beforeEach(function () {
        mockDatastore = jasmine.createSpyObj('mockDatastore', ['get', 'find', 'create', 'update', 'refresh', 'remove']);
        persistenceManager = new persistence_manager_1.PersistenceManager(mockDatastore, projectConfiguration);
        persistenceManager.setOldVersions([{ resource: {} }]);
        mockDatastore.get.and.callFake(getFunction);
        mockDatastore.find.and.callFake(findFunction);
        mockDatastore.update.and.callFake(successFunction);
        mockDatastore.create.and.callFake(successFunction);
        mockDatastore.remove.and.callFake(successFunction);
        doc = { 'resource': {
                'id': '1', 'identifier': 'ob1',
                'type': 'object',
                'relations': {}
            } };
        relatedDoc = { 'resource': {
                'id': '2', 'identifier': 'ob2',
                'type': 'object',
                'relations': {}
            } };
        anotherRelatedDoc = { 'resource': {
                'id': '3', 'identifier': 'ob3',
                'type': 'object',
                'relations': {}
            } };
        findResult = [];
    });
    it('should save the base object', function (done) {
        persistenceManager.persist(doc).then(function () {
            expect(mockDatastore.update).toHaveBeenCalledWith(doc);
            done();
        }, function (err) { fail(err); done(); });
    });
    it('should save the related document', function (done) {
        doc.resource.relations['BelongsTo'] = ['2'];
        persistenceManager.persist(doc).then(function () {
            expect(mockDatastore.update).toHaveBeenCalledWith(relatedDoc);
            expect(relatedDoc.resource.relations['Contains'][0]).toBe('1');
            done();
        }, function (err) { fail(err); done(); });
    });
    it('should save an object with a one way relation', function (done) {
        doc.resource.relations['isRecordedIn'] = ['2'];
        persistenceManager.persist(doc).then(function () {
            expect(mockDatastore.update).not.toHaveBeenCalledWith(relatedDoc);
            done();
        }, function (err) { fail(err); done(); });
    });
    it('should remove a document', function (done) {
        doc.resource.relations['BelongsTo'] = ['2'];
        relatedDoc.resource.relations['Contains'] = ['1'];
        persistenceManager.remove(doc).then(function () {
            expect(mockDatastore.update).toHaveBeenCalledWith(relatedDoc);
            expect(relatedDoc.resource.relations['Contains']).toBe(undefined);
            done();
        }, function (err) { fail(err); done(); });
    });
    it('should remove a document with a one way relation', function (done) {
        doc.resource.relations['isRecordedIn'] = ['2'];
        persistenceManager.remove(doc).then(function () {
            expect(mockDatastore.update).not.toHaveBeenCalledWith(relatedDoc);
            done();
        }, function (err) { fail(err); done(); });
    });
    it('should remove a main type resource', function (done) {
        relatedDoc.resource.relations['isRecordedIn'] = ['1'];
        relatedDoc.resource.relations['Contains'] = ['3'];
        anotherRelatedDoc.resource.relations['BelongsTo'] = ['2'];
        findResult = [relatedDoc];
        persistenceManager.remove(doc).then(function () {
            expect(mockDatastore.remove).toHaveBeenCalledWith(relatedDoc);
            expect(mockDatastore.update).toHaveBeenCalledWith(anotherRelatedDoc);
            expect(anotherRelatedDoc.resource.relations['BelongsTo']).toBeUndefined();
            done();
        }, function (err) { fail(err); done(); });
    });
    it('should add two relations of the same type', function (done) {
        doc.resource.relations['BelongsTo'] = ['2', '3'];
        persistenceManager.persist(doc).then(function () {
            // expect(mockDatastore.update).toHaveBeenCalledWith(relatedObject);
            // right now it is not possible to test both objects due to problems with the return val of promise.all
            expect(mockDatastore.update).toHaveBeenCalledWith(anotherRelatedDoc);
            // expect(relatedObject['Contains'][0]).toBe('1');
            expect(anotherRelatedDoc['resource']['relations']['Contains'][0]).toBe('1');
            done();
        }, function (err) { fail(err); done(); });
    });
    it('should delete a relation which is not present in the new version of the doc anymore', function (done) {
        var oldVersion = { 'resource': {
                'id': '1', 'identifier': 'ob1',
                'type': 'object',
                'relations': { 'BelongsTo': ['2'] }
            } };
        relatedDoc.resource.relations['Contains'] = ['1'];
        persistenceManager.setOldVersions([oldVersion]);
        persistenceManager.persist(doc).then(function () {
            expect(mockDatastore.update).toHaveBeenCalledWith(doc);
            expect(mockDatastore.update).toHaveBeenCalledWith(relatedDoc);
            expect(doc.resource.relations['BelongsTo']).toBe(undefined);
            expect(relatedDoc.resource.relations['Contains']).toBe(undefined);
            done();
        }, function (err) { fail(err); done(); });
    });
});
//# sourceMappingURL=persistence-manager.spec.js.map