import {
    CategoryConverter, ConstraintIndex, Document, DocumentCache, DocumentDatastore, IdaiFieldFindResult,
    IdGenerator, IndexFacade, PouchdbDatastore, PouchDbFactory, PouchdbManager, Query, SyncProcess
} from 'idai-field-core';
import { Observable } from 'rxjs';

export class DocumentRepository {

    private constructor(private pouchdbManager: PouchdbManager,
                        private pouchdbDatastore: PouchdbDatastore,
                        private datastore: DocumentDatastore) {}

    public static async init(project: string, pouchDbFactory: PouchDbFactory): Promise<DocumentRepository> {

        const pouchdbManager = new PouchdbManager(pouchDbFactory);
        const db = await pouchdbManager.createDb(project, { _id: 'project' } , false);
        const pouchdbDatastore = new PouchdbDatastore(db, new IdGenerator(), true);
        const documentDatastore = buildDocumentDatastore(pouchdbDatastore);

        return new DocumentRepository(pouchdbManager, pouchdbDatastore, documentDatastore);
    }


    public destroy = (project: string): Promise<void> =>
        this.pouchdbManager.destroyDb(project);


    public create = (doc: Document, username: string): Promise<Document> =>
        this.datastore.create(doc, username);

    
    public update = (doc: Document, username: string): Promise<Document> =>
        this.datastore.update(doc, username);


    public remove = (doc: Document): Promise<void> =>
        this.datastore.remove(doc);


    public get = (resourceId: string): Promise<Document> =>
        this.datastore.get(resourceId);

    
    public find = (query: Query): Promise<IdaiFieldFindResult<Document>> =>
        this.datastore.find(query, true);


    public changed = (): Observable<Document> =>
        this.pouchdbDatastore.changesNotifications();


    public deleted = (): Observable<Document> =>
        this.pouchdbDatastore.deletedNotifications();


    public setupSync = (url: string, project: string): Promise<SyncProcess> =>
        this.pouchdbManager.setupSync(url, project);


    public stopSync = (): void =>
        this.pouchdbManager.stopSync();

}


const buildDocumentDatastore = (pouchdbDatastore: PouchdbDatastore): DocumentDatastore => {

    const indexFacade = buildIndexFacade();
    const documentCache = new DocumentCache<Document>();
    const categoryConverter = buildDummyCategoryConverter();

    return new DocumentDatastore(pouchdbDatastore, indexFacade, documentCache, categoryConverter);
};


const buildIndexFacade = (showWarnings = true): IndexFacade => {

    const createdConstraintIndex = ConstraintIndex.make({
        /* eslint-disable max-len */
        'isRecordedIn:contain': { path: 'resource.relations.isRecordedIn', pathArray: ['resource', 'relations', 'isRecordedIn'], type: 'contain' },
        'liesWithin:contain': { path: 'resource.relations.liesWithin', pathArray: ['resource', 'relations', 'liesWithin'], type: 'contain', recursivelySearchable: true },
        'liesWithin:exist': { path: 'resource.relations.liesWithin', pathArray: ['resource', 'relations', 'liesWithin'], type: 'exist' },
        'depicts:contain': { path: 'resource.relations.depicts', pathArray: ['resource', 'relations', 'depicts'], type: 'contain' },
        'depicts:exist': { path: 'resource.relations.depicts', pathArray: ['resource', 'relations', 'depicts'], type: 'exist' },
        'isDepictedIn:exist': { path: 'resource.relations.isDepictedIn', pathArray: ['resource', 'relations', 'isDepictedIn'], type: 'exist' },
        'isDepictedIn:links': { path: 'resource.relations.isDepictedIn', pathArray: ['resource', 'relations', 'isDepictedIn'], type: 'links' },
        'isMapLayerOf:exist': { path: 'resource.relations.isMapLayerOf', pathArray: ['resource', 'relations', 'isMapLayerOf'], type: 'exist' },
        'identifier:match': { path: 'resource.identifier', pathArray: ['resource', 'identifier'], type: 'match' },
        'id:match': { path: 'resource.id', pathArray: ['resource', 'id'], type: 'match' },
        'geometry:exist': { path: 'resource.geometry', pathArray: ['resource', 'geometry'], type: 'exist' },
        'georeference:exist': { path: 'resource.georeference', pathArray: ['resource', 'georeference'], type: 'exist' },
        /* eslint-enble max-len */
    }, []);

    return new IndexFacade(
        createdConstraintIndex,
        {},
        [],
        showWarnings
    );
};


const buildDummyCategoryConverter = (): CategoryConverter<Document> => ({

        // eslint-disable-next-line @typescript-eslint/no-empty-function
        assertCategoryToBeOfClass: (_categories: string, _categoryClass: string) => {},
        convert: (document: Document) => document,
        getCategoriesForClass: (categoryClass: string) => [categoryClass]
});
