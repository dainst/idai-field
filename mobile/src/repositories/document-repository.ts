import {
    basicIndexConfiguration, DocumentConverter, CategoryForm, ChangesStream,
    ConstraintIndex, Datastore, Document, DocumentCache,
    Forest, Indexer, IndexFacade, NewDocument,
    PouchdbDatastore, ProjectConfiguration, Query, SyncService, Tree
} from 'idai-field-core';
import { Observable } from 'rxjs';

export class DocumentRepository {

    private pouchdbDatastore: PouchdbDatastore;
    private changesStream: ChangesStream;
    public syncService: SyncService;

    public datastore: Datastore;

    constructor(pouchdbDatastore: PouchdbDatastore,
                datastore: Datastore,
                changesStream: ChangesStream
    ) {
        this.pouchdbDatastore = pouchdbDatastore;
        this.datastore = datastore;
        this.changesStream = changesStream;
        this.syncService = new SyncService(pouchdbDatastore);
    }


    public static async init(
        username: string,
        categoryForms: Forest<CategoryForm>,
        pouchdbDatastore: PouchdbDatastore
    ) : Promise<DocumentRepository> {

        const db = pouchdbDatastore.getDb();
        const projectConfiguration = new ProjectConfiguration({
            forms: categoryForms, categories: {}, relations: [], commonFields: {}, valuelists: {}
        });
        const [datastore, changesStream] = await buildDatastore(
            categoryForms, pouchdbDatastore, db, username, projectConfiguration);

        return new DocumentRepository(pouchdbDatastore, datastore, changesStream);
    }


    public destroy = (project: string): Promise<void> =>
        this.pouchdbDatastore.destroyDb(project);


    public create = (doc: Document | NewDocument): Promise<Document> =>
        this.datastore.create(doc);

    
    public update = (doc: Document): Promise<Document> =>
        this.datastore.update(doc);


    public remove = (doc: Document): Promise<void> =>
        this.datastore.remove(doc);


    public get = (resourceId: string): Promise<Document> =>
        this.datastore.get(resourceId);

        
    public getMultiple = (resourceIds: string[]): Promise<Document[]> =>
        this.datastore.getMultiple(resourceIds);

    
    public find = (query: Query): Promise<Datastore.FindResult> =>
        this.datastore.find(query);


    public changed = (): Observable<Document> =>
        this.pouchdbDatastore.changesNotifications();


    public deleted = (): Observable<Document> =>
        this.pouchdbDatastore.deletedNotifications();


    public remoteChanged = (): Observable<Document> =>
        this.changesStream.remoteChangesNotifications();
}


const buildDatastore = async (
        categories: Forest<CategoryForm>,
        pouchdbDatastore: PouchdbDatastore,
        db: PouchDB.Database,
        username: string,
        projectConfiguration: ProjectConfiguration
    ): Promise<[Datastore, ChangesStream]> => {

    const indexFacade = buildIndexFacade(projectConfiguration);
    const documentCache = new DocumentCache();
    const converter = new DocumentConverter(projectConfiguration);

    await Indexer.reindex(indexFacade, db, documentCache, converter, false);

    return [
        new Datastore(pouchdbDatastore, indexFacade, documentCache, converter, () => username),
        new ChangesStream(pouchdbDatastore, indexFacade, documentCache, converter, () => username)
    ];
};


const buildIndexFacade = (projectConfiguration: ProjectConfiguration): IndexFacade => {

    const categories = Tree.flatten(projectConfiguration.getCategories());

    const createdConstraintIndex = ConstraintIndex.make({
        /* eslint-disable max-len */
        ...basicIndexConfiguration,
        'depicts:contain': { path: 'resource.relations.depicts', pathArray: ['resource', 'relations', 'depicts'], type: 'contain' },
        'depicts:exist': { path: 'resource.relations.depicts', pathArray: ['resource', 'relations', 'depicts'], type: 'exist' },
        'isDepictedIn:exist': { path: 'resource.relations.isDepictedIn', pathArray: ['resource', 'relations', 'isDepictedIn'], type: 'exist' },
        'isDepictedIn:links': { path: 'resource.relations.isDepictedIn', pathArray: ['resource', 'relations', 'isDepictedIn'], type: 'links' },
        'isMapLayerOf:exist': { path: 'resource.relations.isMapLayerOf', pathArray: ['resource', 'relations', 'isMapLayerOf'], type: 'exist' },
        'geometry:exist': { path: 'resource.geometry', pathArray: ['resource', 'geometry'], type: 'exist' },
        'georeference:exist': { path: 'resource.georeference', pathArray: ['resource', 'georeference'], type: 'exist' },
        /* eslint-enable max-len */
    }, categories);

    return new IndexFacade(
        createdConstraintIndex,
        {},
        projectConfiguration,
        false
    );
};
