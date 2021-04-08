import { doc } from 'idai-field-core';
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

});
