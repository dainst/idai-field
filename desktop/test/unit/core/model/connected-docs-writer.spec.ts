import {Document} from 'idai-field-core';
import {ConnectedDocsWriter} from '../../../../src/app/core/model/connected-docs-writer';
import {ProjectConfiguration} from '../../../../src/app/core/configuration/project-configuration';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('ConnectedDocsWriter', () => {

    const projectConfiguration = new ProjectConfiguration(
        [[] as any,
         [
            {
                name: 'BelongsTo',
                inverse: 'Contains',
                label: 'Enthalten in',
                domain: [],
                range: []
            },
            {
                name: 'Contains',
                inverse: 'BelongsTo',
                label: 'Enthält',
                domain: [],
                range: []
            },
            {
                name: 'isRecordedIn',
                label: 'Gehört zu',
                domain: [],
                range: []
            }]]);

    let mockDatastore;
    let connectedDocsWriter: ConnectedDocsWriter;
    const id = 'abc';

    let doc: Document;
    let relatedDoc: any;
    let anotherRelatedDoc: any;

    const getFunction = async (id) => id === relatedDoc['resource']['id']
            ? relatedDoc : anotherRelatedDoc;


    beforeEach(() => {

        spyOn(console, 'warn');

        mockDatastore = jasmine.createSpyObj('mockDatastore', ['get', 'find', 'create', 'update', 'refresh', 'remove']);

        connectedDocsWriter = new ConnectedDocsWriter(mockDatastore, projectConfiguration);

        mockDatastore.get.and.callFake(getFunction);
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
    });


    it('should save the related document', async done => {

        doc.resource.relations['BelongsTo'] = ['2'];
        mockDatastore.update.and.returnValue(Promise.resolve(doc));

        await connectedDocsWriter.updateConnectedDocumentsForDocumentUpdate(doc, [doc], 'u');

        expect(mockDatastore.update).toHaveBeenCalledWith(relatedDoc, 'u', undefined);
        expect(relatedDoc.resource.relations['Contains'][0]).toBe('1');
        done();
    });


    it('should save an object with a one way relation', async done => {

        doc.resource.relations['isRecordedIn'] = ['2'];
        mockDatastore.update.and.returnValue(Promise.resolve(doc));

        await connectedDocsWriter.updateConnectedDocumentsForDocumentUpdate(doc, [doc], 'u');

        expect(mockDatastore.update).not.toHaveBeenCalledWith(relatedDoc, 'u', undefined);
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

        await connectedDocsWriter.updateConnectedDocumentsForDocumentUpdate(doc, [oldVersion as any], 'u');

        expect(mockDatastore.update).toHaveBeenCalledWith(relatedDoc, 'u', undefined);

        expect(doc.resource.relations['BelongsTo']).toBe(undefined);
        expect(relatedDoc.resource.relations['Contains']).toBe(undefined);
        done();
    });


    it('should add two relations of the same category', async done => {

        doc.resource.relations['BelongsTo'] = ['2', '3'];
        mockDatastore.update.and.returnValue(Promise.resolve(doc));

        await connectedDocsWriter.updateConnectedDocumentsForDocumentUpdate(doc, [doc], 'u');

        expect(mockDatastore.update).toHaveBeenCalledWith(anotherRelatedDoc, 'u', undefined);
        expect(anotherRelatedDoc['resource']['relations']['Contains'][0]).toBe('1');
        done();
    });


    it('remove: should remove a document', async done => {

        doc.resource.relations['BelongsTo']=['2'];
        relatedDoc.resource.relations['Contains']=['1'];

        await connectedDocsWriter.updateConnectedDocumentsForDocumentRemove(doc, 'u');

        expect(mockDatastore.update).toHaveBeenCalledWith(relatedDoc, 'u', undefined);
        expect(relatedDoc.resource.relations['Contains']).toBe(undefined);
        done();
    });


    it('remove: where a connected document does not exist anymore', async done => {

        doc.resource.relations['BelongsTo']=['nonexistent'];

        mockDatastore.get.and.returnValue(Promise.reject('not exists'));
        await connectedDocsWriter.updateConnectedDocumentsForDocumentRemove(doc, 'u');

        expect(mockDatastore.update).not.toHaveBeenCalled();
        done();
    });


    it('remove: should remove a document with a one way relation', async done => {

        doc.resource.relations['isRecordedIn'] = ['2'];

        await connectedDocsWriter.updateConnectedDocumentsForDocumentRemove(doc, 'u');

        expect(mockDatastore.update).not.toHaveBeenCalled();
        done();
    });
});
