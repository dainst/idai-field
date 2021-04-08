import { doc } from 'idai-field-core';
import { last } from 'tsfun';
import { DocumentRepository } from './document-repository';
import PouchDB = require('pouchdb-node');

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


    it('fetch document after creation', async () => {

        const testDoc = await repository.create(doc('Test Document'), 'testuser');
        const fetchedDoc = await repository.fetch(testDoc.resource.id);

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

        return expect(repository.fetch(testDoc.resource.id)).rejects.toBeTruthy();
    });

});
