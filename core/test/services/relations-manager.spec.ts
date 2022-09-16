import { Document } from '../../src/model/document';
import { RelationsManager } from '../../src/services/relations-manager';
import { ProjectConfiguration } from '../../src/services/project-configuration';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('RelationsManager', () => {

    const projectConfiguration = new ProjectConfiguration({
        forms: [{ item: { name: 'Operation' }, trees: []}, { item: { name: 'object'}, trees: []}] as any,
        categories: {},
        relations: [
            {
                name: 'BelongsTo',
                inverse: 'Contains',
                domain: [],
                range: [],
                editable: false,
                inputType: 'relation'
            },
            {
                name: 'Contains',
                inverse: 'BelongsTo',
                domain: [],
                range: [],
                editable: false,
                inputType: 'relation'
            },
            {
                name: 'isRecordedIn',
                domain: [],
                range: [],
                editable: false,
                inputType: 'relation'
            }
        ],
        commonFields: {},
        valuelists: {},
        projectLanguages: []
    });

    let mockDatastore;
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

        spyOn(console, 'warn');

        mockDatastore = jasmine.createSpyObj('mockDatastore',
            ['get', 'getMultiple', 'putCache', 'find', 'create', 'update', 'convert', 'refresh', 'remove']);

        const mockSettingsProvider = jasmine.createSpyObj('settingsProvider', ['getSettings']);
        mockSettingsProvider.getSettings.and.returnValue({ username: 'u' });

        persistenceManager = new RelationsManager(mockDatastore, projectConfiguration);

        mockDatastore.get.and.callFake(getFunction);
        mockDatastore.find.and.callFake(findFunction);
        mockDatastore.update.and.returnValue(Promise.resolve(doc));
        mockDatastore.create.and.returnValue(Promise.resolve(doc));
        mockDatastore.remove.and.returnValue(Promise.resolve('ok'));

        doc = { 'resource' : {
            'id' :'1', 'identifier': 'ob1',
            'category': 'object',
            'relations' : {}
        }} as any;

        relatedDoc = { 'resource' : {
            'id': '2' , 'identifier': 'ob2',
            'category': 'object',
            'relations' : {}
        }};

        anotherRelatedDoc = { 'resource' : {
            'id': '3' , 'identifier': 'ob3',
            'category': 'object',
            'relations' : {}
        }};

        findResult = [];
    });


    it('should save the base object', async done => {

        mockDatastore.update.and.returnValue(Promise.resolve(doc));
        await persistenceManager.update(doc);
        expect(mockDatastore.update).toHaveBeenCalledWith(doc, undefined);
        done();
    });


    it('delete a relation which was present in conflicting revision', async done => {

        const squashVersion = { 'resource' : {
                'id' :'1', 'identifier': 'ob1',
                'category': 'object',
                'relations' : { 'BelongsTo' : [ '2' ] }
            }, '_rev' : '1-a' };

        relatedDoc.resource.relations['Contains'] = ['1'];

        await persistenceManager.update(doc, doc, [squashVersion] as any);

        expect(mockDatastore.update).toHaveBeenCalledWith(
            jasmine.objectContaining({
                resource : jasmine.objectContaining({ id: '1' })
            }), ['1-a']);

        expect(mockDatastore.update).toHaveBeenCalledWith(
            jasmine.objectContaining({
                resource : jasmine.objectContaining({ id: '2' })
            }), undefined);

        expect(doc.resource.relations['BelongsTo']).toBe(undefined);
        expect(relatedDoc.resource.relations['Contains']).toBe(undefined);
        done();
    });


    it('should save the related document for a new document', async done => {

        doc.resource.relations['BelongsTo'] = ['2'];
        const clonedDoc = Document.clone(doc);
        delete doc.resource.id; // make it a 'new' document

        mockDatastore.create.and.returnValue(Promise.resolve(clonedDoc)); // has resourceId, simulates create

        await persistenceManager.update(doc);

        expect(mockDatastore.update).toHaveBeenCalledWith(relatedDoc,  undefined);
        expect(relatedDoc.resource.relations['Contains'][0]).toBe('1'); // the '1' comes from clonedDoc.resource.id
        done();
    });


    it('remove: should remove an operation, another related resource gets relation updated', async done => {

        relatedDoc.resource.relations['isRecordedIn'] = ['1'];
        relatedDoc.resource.relations['Contains'] = ['3'];
        anotherRelatedDoc.resource.relations['BelongsTo'] = ['2'];

        findResult /* for isRecordedIn "1" */ = [relatedDoc];

        await persistenceManager.remove(doc, { descendants: true });
        expect(mockDatastore.remove).toHaveBeenCalledWith(relatedDoc);
        expect(mockDatastore.update).toHaveBeenCalledWith(anotherRelatedDoc, undefined);
        expect(mockDatastore.remove).not.toHaveBeenCalledWith(anotherRelatedDoc);
        expect(anotherRelatedDoc.resource.relations['BelongsTo']).toBeUndefined();
        done();
    });


    it('remove: should remove an operation, with two dependent resources', async done => {

        relatedDoc.resource.relations['isRecordedIn'] = ['1'];
        relatedDoc.resource.relations['Contains'] = ['3'];

        anotherRelatedDoc.resource.relations['BelongsTo'] = ['2']; // when anotherRelatedDoc gets deleted, relatedDoc is already gone
        anotherRelatedDoc.resource.relations['isRecordedIn'] = ['1'];

        findResult /* for isRecordedIn "1" */ = [relatedDoc, anotherRelatedDoc];

        mockDatastore.get.and.returnValues(
            Promise.resolve(doc), // for being related to relatedDoc
            Promise.resolve(anotherRelatedDoc), // for being related to relatedDoc
            Promise.reject('not exists') // for relatedDoc already deleted, but still linked from anotherRelatedDoc
        );

        await persistenceManager.remove(doc, { descendants: true });

        // do not update for beeing related to relatedDoc
        expect(mockDatastore.update).not.toHaveBeenCalledWith(doc);
        // this gets updates for beeing related to relatedDoc
        expect(mockDatastore.update).toHaveBeenCalledWith(anotherRelatedDoc, undefined);
        expect(mockDatastore.remove).toHaveBeenCalledWith(relatedDoc);
        expect(mockDatastore.remove).toHaveBeenCalledWith(anotherRelatedDoc);
        expect(mockDatastore.remove).toHaveBeenCalledWith(doc);
        done();
    });


    it('resource move: should correct lies within relations when resource moved to other operation', async done => {

        doc.resource.relations['isRecordedIn'] = ['t2'];
        relatedDoc.resource.relations = { liesWithin: ['1'], isRecordedIn: ['t1'] };
        anotherRelatedDoc.resource.relations = { liesWithin: ['2'], isRecordedIn: ['t1'] };

        mockDatastore.find.and.returnValue(Promise.resolve({ documents: [relatedDoc, anotherRelatedDoc] }));

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

        await persistenceManager.update(doc);

        expect(checked1 && checked2 && checked3).toBe(true);
        expect(relatedDoc.resource.relations.isRecordedIn[0]).toEqual('t1'); // originals untouched
        expect(anotherRelatedDoc.resource.relations.isRecordedIn[0]).toEqual('t1');
        done();
    });


    it('resource move: only (!) correct lies within relations when resource moved to other (!) operation', async done => {

        doc.resource.relations['isRecordedIn'] = ['t1'];
        relatedDoc.resource.relations = { liesWithin: ['1'], isRecordedIn: ['t1'] };
        anotherRelatedDoc.resource.relations = { liesWithin: ['2'], isRecordedIn: ['t1'] };

        mockDatastore.find.and.returnValue(Promise.resolve({ documents: [relatedDoc, anotherRelatedDoc] }));

        mockDatastore.update.and.callFake((doc: any, u: string) => Promise.resolve(doc));
        await persistenceManager.update(doc);
        expect(mockDatastore.update).toHaveBeenCalledTimes(1);

        done();
    });


    it('resource move: filter docs without isRecordedIn', async done => {

        doc.resource.relations['isRecordedIn'] = ['t1'];
        relatedDoc.resource.relations = { liesWithin: ['1'], isRecordedIn: ['t2'] };
        anotherRelatedDoc.resource.relations = { liesWithin: ['2'] };

        mockDatastore.find.and.returnValue(Promise.resolve({ documents: [relatedDoc, anotherRelatedDoc] }));

        mockDatastore.update.and.callFake((doc: any, u: string) => Promise.resolve(doc));
        await persistenceManager.update(doc);
        expect(mockDatastore.update).toHaveBeenCalledTimes(2);

        done();
    });
});
