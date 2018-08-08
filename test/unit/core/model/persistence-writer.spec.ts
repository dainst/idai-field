import {Document, ProjectConfiguration} from 'idai-components-2/core';
import {clone} from '../../../../app/util/object-util';
import {PersistenceWriter} from '../../../../app/core/model/persistence-writer';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('PersistenceWriter', () => {

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
    let persistenceWriter;
    const id = 'abc';

    let doc: Document;
    let relatedDoc: any;
    let anotherRelatedDoc: any;

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


    beforeEach(() => {

        spyOn(console, 'warn');

        mockDatastore = jasmine.createSpyObj('mockDatastore', ['get', 'find', 'create', 'update', 'refresh', 'remove']);
        mockTypeUtility = jasmine.createSpyObj('mockTypeUtility', ['isSubtype']);
        mockTypeUtility.isSubtype.and.returnValue(true);

        persistenceWriter = new PersistenceWriter(mockDatastore, projectConfiguration);

        mockDatastore.get.and.callFake(getFunction);
        mockDatastore.update.and.returnValue(Promise.resolve(doc));
        mockDatastore.create.and.returnValue(Promise.resolve(doc));
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
    });


    it('should save the base object', async done => {

        mockDatastore.update.and.returnValue(Promise.resolve(doc));
        await persistenceWriter.update(doc, doc, [], 'u');
        expect(mockDatastore.update).toHaveBeenCalledWith(doc, 'u', undefined);
        done();
    });


    it('should save the related document', async done => {

        doc.resource.relations['BelongsTo'] = ['2'];
        mockDatastore.update.and.returnValue(Promise.resolve(doc));

        await persistenceWriter.update(doc, doc, [], 'u');

        expect(mockDatastore.update).toHaveBeenCalledWith(relatedDoc, 'u', undefined);
        expect(relatedDoc.resource.relations['Contains'][0]).toBe('1');
        done();
    });


    it('should save the related document for a new document', async done => {

        doc.resource.relations['BelongsTo'] = ['2'];
        const clonedDoc = clone(doc);
        delete doc.resource.id; // make it a 'new' document

        mockDatastore.create.and.returnValue(Promise.resolve(clonedDoc)); // has resourceId, simulates create

        await persistenceWriter.update(doc, doc, [], 'u');

        expect(mockDatastore.update).toHaveBeenCalledWith(relatedDoc, 'u', undefined);
        expect(relatedDoc.resource.relations['Contains'][0]).toBe('1'); // the '1' comes from clonedDoc.resource.id
        done();
    });


    it('should save an object with a one way relation', async done => {

        doc.resource.relations['isRecordedIn'] = ['2'];
        mockDatastore.update.and.returnValue(Promise.resolve(doc));

        await persistenceWriter.update(doc, doc, [], 'u');

        expect(mockDatastore.update).not.toHaveBeenCalledWith(relatedDoc, 'u', undefined);
        done();
    });


    it('should add two relations of the same type', async done => {

        doc.resource.relations['BelongsTo'] = ['2', '3'];
        mockDatastore.update.and.returnValue(Promise.resolve(doc));

        await persistenceWriter.update(doc, doc, [], 'u');

        // expect(mockDatastore.update).toHaveBeenCalledWith(relatedObject);
        // right now it is not possible to test both objects due to problems with the return val of promise.all
        expect(mockDatastore.update).toHaveBeenCalledWith(anotherRelatedDoc, 'u', undefined);
        // expect(relatedObject['Contains'][0]).toBe('1');
        expect(anotherRelatedDoc['resource']['relations']['Contains'][0]).toBe('1');
        done();
    });


    it('delete a relation which was present in old version', async done => {

        const oldVersion = { 'resource' : {
                'id' :'1', 'identifier': 'ob1',
                'type': 'object',
                'relations' : { 'BelongsTo' : [ '2' ] }
            }};

        relatedDoc.resource.relations['Contains'] = ['1'];
        mockDatastore.update.and.returnValue(Promise.resolve(doc));

        await persistenceWriter.update(doc, oldVersion, [], 'u');

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

        await persistenceWriter.update(doc,  doc, [squashVersion], 'u');

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

        await persistenceWriter.remove(doc, doc, 'u');

        expect(mockDatastore.update).toHaveBeenCalledWith(relatedDoc, 'u', undefined);
        expect(relatedDoc.resource.relations['Contains']).toBe(undefined);
        done();
    });


    it('remove: should remove a document with a one way relation', async done => {

        doc.resource.relations['isRecordedIn'] = ['2'];

        await persistenceWriter.remove(doc, doc, 'u');

        expect(mockDatastore.update).not.toHaveBeenCalled();
        done();
    });
});