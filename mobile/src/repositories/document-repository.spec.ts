import { createDocuments, doc } from 'idai-field-core';
import PouchDB from 'pouchdb-node';
import { last } from 'tsfun';
import { DocumentRepository } from './document-repository';


describe('DocumentRepository', () => {

    const project = 'testdb';
    
    let repository: DocumentRepository;

    
    beforeEach(async () => {
        
        repository = await DocumentRepository.init(project, (name: string) => new PouchDB(name));
    });


    afterEach(async () => repository.destroy(project));


    it('creates document', async () => {

        const newDoc = await repository.create(doc('Test Document'), 'testuser');

        expect(newDoc.resource.shortDescription).toEqual('Test Document');
        expect(newDoc.created.user).toEqual('testuser');
        expect(newDoc.created.date.getTime()).toBeGreaterThan(Date.now() - 1000);
    });


    it('get document after creation', async () => {

        const testDoc = await repository.create(doc('Test Document'), 'testuser');
        const fetchedDoc = await repository.get(testDoc.resource.id);

        expect(fetchedDoc.resource).toEqual(testDoc.resource);
    });

    
    it('updates document', async () => {
        
        const testDoc = await repository.create(doc('Test Document'), 'testuser1');
        testDoc.resource.shortDescription = 'Updated test document';
        const updatedDoc = await repository.update(testDoc, 'testuser2');

        expect(updatedDoc.resource.shortDescription).toEqual('Updated test document');
        expect(last(updatedDoc.modified)?.user).toEqual('testuser2');
        expect(last(updatedDoc.modified)?.date.getTime()).toBeGreaterThan(Date.now() - 1000);
    });

    
    it('removes document', async () => {
        
        const testDoc = await repository.create(doc('Test Document'), 'testuser');
        await repository.remove(testDoc);

        return expect(repository.get(testDoc.resource.id)).rejects.toBeTruthy();
    });
    

    it('finds document by parent', async () => {

        const docs = Object.values(createDocuments([
            ['id1', 'Feature', ['id2']],
            ['id2', 'Find'],
            ['id3', 'Find']
        ]));
        await Promise.all(docs.map(async d => await repository.create(d, 'testuser')));
        
        const { documents: foundDocs } = await repository.find({ constraints: { 'liesWithin:contain': 'id1' } });
        expect(foundDocs).toHaveLength(1);
        expect(foundDocs[0].resource.id).toEqual('id2');
    });
    

    it('finds documents by full-text query', async () => {

        const docs = [
            doc('Test Document', 'T1'),
            doc('Tester Document', 'T2'),
            doc('Toast Document', 'T12'),
        ];
        await Promise.all(docs.map(async d => await repository.create(d, 'testuser')));
        
        const { totalCount: count1 } = await repository.find({});
        expect(count1).toEqual(3);
        
        const { totalCount: count } = await repository.find({ q: 'Test' });
        expect(count).toEqual(2);

        const { totalCount: count2 } = await repository.find({ q: 'Document' });
        expect(count2).toEqual(3);
    });
});
