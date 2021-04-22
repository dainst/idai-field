import {
    ChangesStream,
    ConstraintIndex, Converter, Datastore, Document, DocumentCache, FindResult,
    IdGenerator, Indexer, IndexFacade, PouchdbDatastore, PouchDbFactory, PouchdbManager, Query, SyncProcess
} from 'idai-field-core';
import { Observable } from 'rxjs';

export class DocumentRepository {

    private constructor(private pouchdbManager: PouchdbManager,
                        private pouchdbDatastore: PouchdbDatastore,
                        private datastore: Datastore,
                        private changesStream: ChangesStream) {}

    public static async init(project: string, pouchDbFactory: PouchDbFactory, username: string)
            : Promise<DocumentRepository> {

        const pouchdbManager = new PouchdbManager(pouchDbFactory);
        const db = await pouchdbManager.createDb(project, { _id: 'project', resource: { id: 'project' } }, false);
        const pouchdbDatastore = new PouchdbDatastore(db, new IdGenerator(), true);
        const [datastore, changesStream] = await buildDatastore(pouchdbDatastore, db, username);

        return new DocumentRepository(pouchdbManager, pouchdbDatastore, datastore, changesStream);
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

    
    public find = (query: Query): Promise<FindResult> =>
        this.datastore.find(query, true);


    public changed = (): Observable<Document> =>
        this.pouchdbDatastore.changesNotifications();


    public deleted = (): Observable<Document> =>
        this.pouchdbDatastore.deletedNotifications();


    public remoteChanged = (): Observable<Document> =>
        this.changesStream.remoteChangesNotifications();


    public setupSync = (url: string, project: string): Promise<SyncProcess> =>
        this.pouchdbManager.setupSync(url, project, isNotAnImage);


    public stopSync = (): void =>
        this.pouchdbManager.stopSync();

}


const buildDatastore = async (pouchdbDatastore: PouchdbDatastore,
        db: PouchDB.Database,
        username: string
    ): Promise<[Datastore, ChangesStream]> => {

    const indexFacade = buildIndexFacade();
    const documentCache = new DocumentCache();
    const converter = buildDummyCategoryConverter();

    await Indexer.reindex(indexFacade, db, documentCache, converter);

    return [
        new Datastore(pouchdbDatastore, indexFacade, documentCache, converter),
        new ChangesStream(pouchdbDatastore, indexFacade, documentCache, converter, () => username)
    ];
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


const buildDummyCategoryConverter = (): Converter => ({

        // eslint-disable-next-line @typescript-eslint/no-empty-function
        convert: (document: Document) => document
});


const isNotAnImage = (doc: Document) => !['Image', 'Photo', 'Drawing'].includes(doc.resource.type);
