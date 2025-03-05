import {
  CategoryForm,
  createCategory,
  createDocuments,
  doc,
  Document,
  Forest,
  IdGenerator,
  PouchdbDatastore,
} from 'idai-field-core';
import PouchDB from 'pouchdb-node';
import { last } from 'tsfun';
import { DocumentRepository } from './document-repository';

describe('DocumentRepository', () => {
  const project = 'testdb';

  let repository: DocumentRepository;

  beforeEach(async () => {
    const datastore = new PouchdbDatastore(
      (name: string) => new PouchDB(name),
      new IdGenerator()
    );
    await datastore.createDb(
      project,
      { _id: 'project', resource: { id: 'project' } },
      true
    );
    const categories: Forest<CategoryForm> = [
      createCategory('Feature'),
      createCategory('Find'),
    ];
    repository = await DocumentRepository.init(
      'testuser',
      categories,
      datastore
    );
  });

  afterEach(async () => repository.destroy(project));

  it('creates document', async () => {
    const newDoc = await repository.create(doc('Test Document'));

    expect(newDoc.resource.shortDescription).toEqual('Test Document');
    expect(newDoc.created.user).toEqual('testuser');
    expect(newDoc.created.date.getTime()).toBeGreaterThan(Date.now() - 1000);
  });

  it('get document after creation', async () => {
    const testDoc = await repository.create(doc('Test Document'));
    const testDoc2 = await repository.create(doc('Test Document2'));
    const fetchedDocs = await repository.getMultiple([
      testDoc.resource.id,
      testDoc2.resource.id,
    ]);

    expect(fetchedDocs.length).toBe(2);
    expect(fetchedDocs[0].resource).toEqual(testDoc.resource);
    expect(fetchedDocs[1].resource).toEqual(testDoc2.resource);
  });

  it('gets documents after creation', async () => {
    const testDoc = await repository.create(doc('Test Document'));
    const fetchedDoc = await repository.get(testDoc.resource.id);

    expect(fetchedDoc.resource).toEqual(testDoc.resource);
  });

  it('updates document', async () => {
    const newShortDescription = 'Updated test document';
    const testDoc = await repository.create(doc('Test Document'));
    testDoc.resource.shortDescription = newShortDescription;
    const updatedDoc = await repository.update(testDoc);

    expect(updatedDoc.resource.shortDescription).toEqual(newShortDescription);
    expect(last(updatedDoc.modified)?.date.getTime()).toBeGreaterThan(
      Date.now() - 1000
    );
  });

  it('removes document', async () => {
    const testDoc = await repository.create(doc('Test Document'));
    await repository.remove(testDoc);

    return expect(repository.get(testDoc.resource.id)).rejects.toBeTruthy();
  });

  it('finds document by parent', async () => {
    const docs = Object.values(
      createDocuments([
        ['id1', 'Feature', ['id2']],
        ['id2', 'Find'],
        ['id3', 'Find'],
      ])
    );
    await Promise.all(docs.map(async (d) => await repository.create(d)));

    const { documents: foundDocs } = await repository.find({
      constraints: { 'isChildOf:contain': 'id1' },
    });
    expect(foundDocs).toHaveLength(1);
    expect(foundDocs[0].resource.id).toEqual('id2');
  });

  it('finds documents by full-text query', async () => {
    const docs = [
      doc('Test Document', 'T1'),
      doc('Tester Document', 'T2'),
      doc('Toast Document', 'T12'),
    ];
    await Promise.all(docs.map(async (d) => await repository.create(d)));

    const { totalCount: count1 } = await repository.find({});
    expect(count1).toEqual(3);

    const { totalCount: count } = await repository.find({ q: 'Test' });
    expect(count).toEqual(2);

    const { totalCount: count2 } = await repository.find({ q: 'Document' });
    expect(count2).toEqual(3);
  });

  it('finds documents by category', async () => {
    const docs = [
      doc('Test Document', 'T1', 'Feature', 'id1'),
      doc('Tester Document', 'T2', 'Find'),
      doc('Toast Document', 'T12', 'Find'),
    ];
    await Promise.all(docs.map(async (d) => await repository.create(d)));

    const { documents: foundDocs } = await repository.find({
      categories: ['Feature'],
    });
    expect(foundDocs).toHaveLength(1);
    expect(foundDocs[0].resource.id).toEqual('id1');
  });

  xit('notifies of creation', async () => {
    const docChanged = new Promise<Document>((resolve) => {
      repository.changed().subscribe(async (d) => resolve(d));
    });

    const testDoc = await repository.create(doc('Test Document'));
    const changedDoc = await docChanged;
    expect(changedDoc.resource.id).toEqual(testDoc.resource.id);
  });

  xit('notifies of changes', async () => {
    const testDoc = await repository.create(doc('Test Document'));
    // prevent docChanged from picking up creation
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 100));
    const docChanged = new Promise<Document>((resolve) => {
      repository.changed().subscribe(async (d) => resolve(d));
    });

    testDoc.resource.shortDescription = 'Toast Document';
    await repository.update(testDoc);
    const changedDoc = await docChanged;
    expect(changedDoc.resource.shortDescription).toEqual(
      testDoc.resource.shortDescription
    );
  });

  xit('notifies of deletion', async () => {
    const testDoc = await repository.create(doc('Test Document'));
    const docDeleted = new Promise<Document>((resolve) => {
      repository.deleted().subscribe(async (d) => resolve(d));
    });

    await repository.remove(testDoc);
    const deletedDoc = await docDeleted;
    expect(deletedDoc.resource.id).toEqual(testDoc.resource.id);
  });
});
