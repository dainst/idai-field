import {Document} from 'idai-components-2/core';
import {ProjectConfiguration} from 'idai-components-2/core';
import {PersistenceManager} from "../../../../app/core/model/persistence-manager";
import {clone} from '../../../../app/util/object-util';
import {PersistenceWriter} from '../../../../app/core/model/persistence-writer';

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

        persistenceManager = new PersistenceManager(
            mockDatastore, projectConfiguration, mockTypeUtility,
            new PersistenceWriter(mockDatastore, projectConfiguration));
        mockDatastore.get.and.callFake(getFunction);
        mockDatastore.find.and.callFake(findFunction);
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

        findResult = [];
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