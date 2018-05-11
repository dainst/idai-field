import {Document} from 'idai-components-2/core';
import {ProjectConfiguration} from 'idai-components-2/core';
import {PersistenceManager} from "../../../../app/core/persist/persistence-manager";

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('PersistenceManager', () => {

    const projectConfiguration = new ProjectConfiguration({
        'types': [

        ],
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

    let mockDatastore;
    let mockTypeUtility;
    let persistenceManager;
    const id = 'abc';

    let doc: Document;
    let relatedDoc: any;
    let anotherRelatedDoc: any;

    let findResult: Array<Document>;

    let getFunction = function(id) {
        return new Promise(resolve => {
            if (id === relatedDoc['resource']['id']) {
                resolve(relatedDoc);
            }
            else {
                resolve(anotherRelatedDoc);
            }
        });
    };


    let findFunction = function() {
        return new Promise(resolve => {
            const findResultCopy = findResult;
            findResult = [];
            resolve({ documents: findResultCopy });
        });
    };


    beforeEach(() => {

        spyOn(console, 'warn');

        mockDatastore = jasmine.createSpyObj('mockDatastore', ['get', 'find', 'create', 'update', 'refresh', 'remove']);
        mockTypeUtility = jasmine.createSpyObj('mockTypeUtility', ['isSubtype']);
        mockTypeUtility.isSubtype.and.returnValue(true);

        persistenceManager = new PersistenceManager(mockDatastore, projectConfiguration, mockTypeUtility);
        mockDatastore.get.and.callFake(getFunction);
        mockDatastore.find.and.callFake(findFunction);
        mockDatastore.update.and.returnValue(Promise.resolve('ok'));
        mockDatastore.create.and.returnValue(Promise.resolve('ok'));
        mockDatastore.remove.and.returnValue(Promise.resolve('ok'));

        doc = { 'resource' : {
            'id' :'1', 'identifier': 'ob1',
            'type': 'object',
            'relations' : {}
        }} as any;

        relatedDoc = { 'resource' : {
            'id': '2' , 'identifier': 'ob2',
            'type': 'object',
            'relations' : {}
        }};

        anotherRelatedDoc = { 'resource' : {
            'id': '3' , 'identifier': 'ob3',
            'type': 'object',
            'relations' : {}
        }};

        findResult = [];
    });


    it('should save the base object', done => {

        persistenceManager.persist(doc, 'u').then(() => {
            expect(mockDatastore.update).toHaveBeenCalledWith(doc, 'u', undefined);
            done();
        }, err => { fail(err); done(); });
    });


    it('should save the related document', done => {

        doc.resource.relations['BelongsTo'] = ['2'];

        persistenceManager.persist(doc, 'u').then(() => {

            expect(mockDatastore.update).toHaveBeenCalledWith(relatedDoc, 'u', undefined);
            expect(relatedDoc.resource.relations['Contains'][0]).toBe('1');
            done();

        }, err => { fail(err); done(); });
    });


    it('should save an object with a one way relation', done => {

        doc.resource.relations['isRecordedIn'] = ['2'];

        persistenceManager.persist(doc, 'u').then(() => {

            expect(mockDatastore.update).not.toHaveBeenCalledWith(relatedDoc, 'u', undefined);
            done();

        }, err => { fail(err); done(); });
    });


    it('should add two relations of the same type', done => {

        doc.resource.relations['BelongsTo'] = ['2', '3'];

        persistenceManager.persist(doc, 'u').then(() => {

            // expect(mockDatastore.update).toHaveBeenCalledWith(relatedObject);
            // right now it is not possible to test both objects due to problems with the return val of promise.all
            expect(mockDatastore.update).toHaveBeenCalledWith(anotherRelatedDoc, 'u', undefined);
            // expect(relatedObject['Contains'][0]).toBe('1');
            expect(anotherRelatedDoc['resource']['relations']['Contains'][0]).toBe('1');
            done();

        }, err => { fail(err); done(); });
    });


    it('delete a relation which was present in old version', async done => {

        const oldVersion = { 'resource' : {
            'id' :'1', 'identifier': 'ob1',
            'type': 'object',
            'relations' : { 'BelongsTo' : [ '2' ] }
        }};

        relatedDoc.resource.relations['Contains'] = ['1'];

        await persistenceManager.persist(doc, 'u', oldVersion);

        expect(mockDatastore.update).toHaveBeenCalledWith(doc, 'u', undefined);
        expect(mockDatastore.update).toHaveBeenCalledWith(relatedDoc, 'u', undefined);

        expect(doc.resource.relations['BelongsTo']).toBe(undefined);
        expect(relatedDoc.resource.relations['Contains']).toBe(undefined);
        done();
    });


    it('delete a relation which was present in conflicting revision', async done => {

        const squashVersion = { 'resource' : {
                'id' :'1', 'identifier': 'ob1',
                'type': 'object',
                'relations' : { 'BelongsTo' : [ '2' ] }
            }, '_rev' : '1-a' };

        relatedDoc.resource.relations['Contains'] = ['1'];

        await persistenceManager.persist(doc, 'u', doc, [squashVersion]);

        expect(mockDatastore.update).toHaveBeenCalledWith(
                jasmine.objectContaining({
                  resource : jasmine.objectContaining({ id: '1' })
                }), 'u', ['1-a']);

        expect(mockDatastore.update).toHaveBeenCalledWith(
            jasmine.objectContaining({
                resource : jasmine.objectContaining({ id: '2' })
            }), 'u', undefined);

        expect(doc.resource.relations['BelongsTo']).toBe(undefined);
        expect(relatedDoc.resource.relations['Contains']).toBe(undefined);
        done();
    });


    it('remove: should remove a document', async done => {

        doc.resource.relations['BelongsTo']=['2'];
        relatedDoc.resource.relations['Contains']=['1'];

        await persistenceManager.remove(doc, 'u');

        expect(mockDatastore.update).toHaveBeenCalledWith(relatedDoc, 'u', undefined);
        expect(relatedDoc.resource.relations['Contains']).toBe(undefined);
        done();
    });


    it('remove: should remove a document with a one way relation', async done => {

        doc.resource.relations['isRecordedIn'] = ['2'];

        await persistenceManager.remove(doc, 'u');

        expect(mockDatastore.update).not.toHaveBeenCalled();
        done();
    });


    it('remove: should remove an operation type resource, another related resource gets relation updated', async done => {

        relatedDoc.resource.relations['isRecordedIn'] = ['1'];
        relatedDoc.resource.relations['Contains'] = ['3'];
        anotherRelatedDoc.resource.relations['BelongsTo'] = ['2'];

        findResult /* for isRecordedIn "1" */ = [relatedDoc];

        await persistenceManager.remove(doc, 'u');
        expect(mockDatastore.remove).toHaveBeenCalledWith(relatedDoc);
        expect(mockDatastore.update).toHaveBeenCalledWith(anotherRelatedDoc, 'u', undefined);
        expect(mockDatastore.remove).not.toHaveBeenCalledWith(anotherRelatedDoc);
        expect(anotherRelatedDoc.resource.relations['BelongsTo']).toBeUndefined();
        done();
    });


    it('remove: should remove an operation type resource, with two dependent resources', async done => {

        relatedDoc.resource.relations['isRecordedIn'] = ['1'];
        relatedDoc.resource.relations['Contains'] = ['3'];

        anotherRelatedDoc.resource.relations['BelongsTo'] = ['2']; // when anotherRelatedDoc gets deleted, relatedDoc is already gone
        anotherRelatedDoc.resource.relations['isRecordedIn'] = ['1'];

        findResult /* for isRecordedIn "1" */ = [relatedDoc, anotherRelatedDoc];

        mockDatastore.get.and.returnValues(
            Promise.resolve(doc), // for being related to relatedDoc
            Promise.resolve(anotherRelatedDoc), // for beeing related to relatedDoc
            Promise.reject('not exists') // for relatedDoc already deleted, but still linked from anotherRelatedDoc
        );

        await persistenceManager.remove(doc, 'u');

        // do not update for beeing related to relatedDoc
        expect(mockDatastore.update).not.toHaveBeenCalledWith(doc, 'u');
        // this gets updates for beeing related to relatedDoc
        expect(mockDatastore.update).toHaveBeenCalledWith(anotherRelatedDoc, 'u', undefined);
        expect(mockDatastore.remove).toHaveBeenCalledWith(relatedDoc);
        expect(mockDatastore.remove).toHaveBeenCalledWith(anotherRelatedDoc);
        expect(mockDatastore.remove).toHaveBeenCalledWith(doc);
        done();
    });


    it('remove: where a connected document does not exist anymore', async done => {

        doc.resource.relations['BelongsTo']=['nonexistent'];

        mockDatastore.get.and.returnValue(Promise.reject('not exists'));

        await persistenceManager.remove(doc, 'u');

        expect(mockDatastore.update).not.toHaveBeenCalled();
        expect(mockDatastore.remove).toHaveBeenCalledWith(doc);
        expect(relatedDoc.resource.relations['Contains']).toBe(undefined);
        done();
    });
});