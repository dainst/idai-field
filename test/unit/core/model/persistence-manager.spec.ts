import {Document, ProjectConfiguration} from 'idai-components-2';
import {PersistenceManager} from "../../../../app/core/model/persistence-manager";
import {clone} from '../../../../app/util/object-util';

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

    let getFunction = async (id) => id === relatedDoc['resource']['id']
        ? relatedDoc : anotherRelatedDoc;


    let findFunction = function() {
        return new Promise(resolve => {
            const findResultCopy = findResult;
            findResult = [];
            resolve({ documents: findResultCopy });
        });
    };


    beforeEach(() => {

        mockDatastore = jasmine.createSpyObj('mockDatastore', ['get', 'find', 'create', 'update', 'refresh', 'remove']);
        mockTypeUtility = jasmine.createSpyObj('mockTypeUtility', ['isSubtype']);
        mockTypeUtility.isSubtype.and.returnValue(true);

        persistenceManager = new PersistenceManager(
            mockDatastore, projectConfiguration, mockTypeUtility);

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


    it('should save the base object', async done => {

        mockDatastore.update.and.returnValue(Promise.resolve(doc));
        await persistenceManager.persist(doc, 'u');
        expect(mockDatastore.update).toHaveBeenCalledWith(doc, 'u', undefined);
        done();
    });


    it('delete a relation which was present in conflicting revision', async done => {

        const squashVersion = { 'resource' : {
                'id' :'1', 'identifier': 'ob1',
                'type': 'object',
                'relations' : { 'BelongsTo' : [ '2' ] }
            }, '_rev' : '1-a' };

        relatedDoc.resource.relations['Contains'] = ['1'];

        await persistenceManager.persist(doc, 'u', doc, [squashVersion] as any);

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


    it('should save the related document for a new document', async done => {

        doc.resource.relations['BelongsTo'] = ['2'];
        const clonedDoc = clone(doc);
        delete doc.resource.id; // make it a 'new' document

        mockDatastore.create.and.returnValue(Promise.resolve(clonedDoc)); // has resourceId, simulates create

        await persistenceManager.persist(doc, 'u');

        expect(mockDatastore.update).toHaveBeenCalledWith(relatedDoc, 'u', undefined);
        expect(relatedDoc.resource.relations['Contains'][0]).toBe('1'); // the '1' comes from clonedDoc.resource.id
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


    it('resource move: should correct lies within relations when resource moved to other operation', async done => {

        doc.resource.relations['isRecordedIn'] = ['t2'];
        relatedDoc.resource.relations = { liesWithin: ['1'], isRecordedIn: ['t1']};
        anotherRelatedDoc.resource.relations = { liesWithin: ['2'], isRecordedIn: ['t1']};

        mockDatastore.find.and.returnValues(
            Promise.resolve({documents:[relatedDoc]}),
            Promise.resolve({documents:[anotherRelatedDoc]}),
            Promise.resolve({documents:[]}));

        let checked1 = false;
        let checked2 = false;
        let checked3 = false;
        mockDatastore.update.and.callFake((doc: any, u: string) => {
            if (doc.resource.id === '2') {
                if (doc.resource.relations.isRecordedIn[0] !== 't2') fail();
                checked2 = true;
            } else if (doc.resource.id === '3') {
                if (doc.resource.relations.isRecordedIn[0] !== 't2') fail();
                checked3 = true;
            } else {
                checked1 = true;
            }
            return Promise.resolve(doc);
        });

        await persistenceManager.persist(doc, 'u');

        expect(checked1 && checked2 && checked3).toBe(true);
        expect(relatedDoc.resource.relations.isRecordedIn[0]).toEqual('t1'); // originals untouched
        expect(anotherRelatedDoc.resource.relations.isRecordedIn[0]).toEqual('t1');
        done();
    });


    it('resource move: only (!) correct lies within relations when resource moved to other (!) operation', async done => {

        doc.resource.relations['isRecordedIn'] = ['t1'];
        relatedDoc.resource.relations = { liesWithin: ['1'], isRecordedIn: ['t1']};
        anotherRelatedDoc.resource.relations = { liesWithin: ['2'], isRecordedIn: ['t1']};

        mockDatastore.find.and.returnValues(
            Promise.resolve({documents:[relatedDoc]}),
            Promise.resolve({documents:[anotherRelatedDoc]}),
            Promise.resolve({documents:[]}));

        mockDatastore.update.and.callFake((doc: any, u: string) => Promise.resolve(doc));
        await persistenceManager.persist(doc, 'u');
        expect(mockDatastore.update).toHaveBeenCalledTimes(1);

        done();
    });


    it('resource move: filter docs without isRecordedIn', async done => {

        doc.resource.relations['isRecordedIn'] = ['t1'];
        relatedDoc.resource.relations = { liesWithin: ['1'], isRecordedIn: ['t2']};
        anotherRelatedDoc.resource.relations = { liesWithin: ['2']};

        mockDatastore.find.and.returnValues(
            Promise.resolve({documents:[relatedDoc]}),
            Promise.resolve({documents:[anotherRelatedDoc]}),
            Promise.resolve({documents:[]}));

        mockDatastore.update.and.callFake((doc: any, u: string) => Promise.resolve(doc));
        await persistenceManager.persist(doc, 'u');
        expect(mockDatastore.update).toHaveBeenCalledTimes(2);

        done();
    });
});