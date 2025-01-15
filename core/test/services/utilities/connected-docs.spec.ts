import { ProjectConfiguration } from '../../../src/services/project-configuration';
import { Document } from '../../../src/model/document/document';
import { ConnectedDocs } from '../../../src/services/utilities/connected-docs'
import { Relation } from '../../../src/model';
import { Name, Named } from '../../../src/tools';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('ConnectedDocs', () => {

    const projectConfiguration = new ProjectConfiguration({
        forms: [],
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
            },
            {
                name: 'isPresentIn',
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
    let inverseRelationsMap: Relation.InverseRelationsMap;
    let relationNames: Array<Name>;

    let doc: Document;
    let relatedDoc: any;
    let anotherRelatedDoc: any;


    beforeEach(() => {

        spyOn(console, 'warn');

        mockDatastore = jasmine.createSpyObj('mockDatastore', ['get', 'update', 'convert', 'findIds']);
        inverseRelationsMap = Relation.makeInverseRelationsMap(projectConfiguration.getRelations());
        relationNames = projectConfiguration.getRelations().map(Named.toName);

        mockDatastore.update.and.returnValue(Promise.resolve(doc));
        mockDatastore.get.and.callFake(async id => {
            return id === relatedDoc['resource']['id'] ? relatedDoc : anotherRelatedDoc;
        });
        mockDatastore.findIds.and.returnValue({ ids: [] });

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
    });


    it('should save the related document', async done => {

        doc.resource.relations['BelongsTo'] = ['2'];
        mockDatastore.update.and.returnValue(Promise.resolve(doc));

        await ConnectedDocs.updateForUpdate(mockDatastore, relationNames, inverseRelationsMap, doc, [doc]);

        expect(mockDatastore.update).toHaveBeenCalledWith(relatedDoc, undefined);
        expect(relatedDoc.resource.relations['Contains'][0]).toBe('1');
        done();
    });


    it('should save an object with a one way relation', async done => {

        doc.resource.relations['isRecordedIn'] = ['2'];
        mockDatastore.update.and.returnValue(Promise.resolve(doc));

        await ConnectedDocs.updateForUpdate(mockDatastore, relationNames, inverseRelationsMap, doc, [doc]);

        expect(mockDatastore.update).not.toHaveBeenCalledWith(relatedDoc, undefined);
        done();
    });


    it('delete a relation which was present in old version', async done => {

        const oldVersion = { 'resource' : {
                'id' :'1', 'identifier': 'ob1',
                'category': 'object',
                'relations' : { 'BelongsTo' : [ '2' ] }
            }};

        relatedDoc.resource.relations['Contains'] = ['1'];
        mockDatastore.update.and.returnValue(Promise.resolve(doc));

        await ConnectedDocs.updateForUpdate(
            mockDatastore, relationNames, inverseRelationsMap, doc, [oldVersion as any]
        );

        expect(mockDatastore.update).toHaveBeenCalledWith(relatedDoc, undefined);

        expect(doc.resource.relations['BelongsTo']).toBe(undefined);
        expect(relatedDoc.resource.relations['Contains']).toBe(undefined);
        done();
    });


    it('should add two relations of the same category', async done => {

        doc.resource.relations['BelongsTo'] = ['2', '3'];
        mockDatastore.update.and.returnValue(Promise.resolve(doc));

        await ConnectedDocs.updateForUpdate(mockDatastore, relationNames, inverseRelationsMap, doc, [doc]);

        expect(mockDatastore.update).toHaveBeenCalledWith(anotherRelatedDoc, undefined);
        expect(anotherRelatedDoc['resource']['relations']['Contains'][0]).toBe('1');
        done();
    });


    it('remove: should remove a document', async done => {

        doc.resource.relations['BelongsTo']=['2'];
        relatedDoc.resource.relations['Contains']=['1'];

        await ConnectedDocs.updateForRemove(mockDatastore, relationNames, inverseRelationsMap, doc);

        expect(mockDatastore.update).toHaveBeenCalledWith(relatedDoc, undefined);
        expect(relatedDoc.resource.relations['Contains']).toBe(undefined);
        done();
    });


    it('remove: where a connected document does not exist anymore', async done => {

        doc.resource.relations['BelongsTo']=['nonexistent'];

        const get = () => Promise.reject('not exists');
        await ConnectedDocs.updateForRemove(mockDatastore, relationNames, inverseRelationsMap, doc);

        expect(mockDatastore.update).not.toHaveBeenCalled();
        done();
    });


    it('remove: should remove a document with a one way relation', async done => {

        doc.resource.relations['isRecordedIn'] = ['2'];

        await ConnectedDocs.updateForRemove(mockDatastore, relationNames, inverseRelationsMap, doc);

        expect(mockDatastore.update).not.toHaveBeenCalled();
        done();
    });


    it('remove: delete isPresentIn relation pointing to deleted document', async done => {

        relatedDoc.resource.relations['isPresentIn'] = ['1'];
        mockDatastore.findIds.and.returnValue({ ids: ['2'] });

        await ConnectedDocs.updateForRemove(mockDatastore, relationNames, inverseRelationsMap, doc);

        expect(mockDatastore.update).toHaveBeenCalledWith(relatedDoc, undefined);
        expect(relatedDoc.resource.relations['isPresentIn']).toBe(undefined);
        done();
    });
});
