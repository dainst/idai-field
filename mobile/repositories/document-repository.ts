import {
    Document, FindResult, IdGenerator, PouchdbDatastore, PouchDbFactory,
    PouchdbManager, Query, SyncProcess
} from 'idai-field-core';
import { Observable } from 'rxjs';

export class DocumentRepository {

    private constructor(private pouchdbManager: PouchdbManager,
                        private pouchdbDatastore: PouchdbDatastore) {}

    public static async init(project: string, pouchDbFactory: PouchDbFactory): Promise<DocumentRepository> {

        const pouchdbManager = new PouchdbManager(pouchDbFactory);
        const db = await pouchdbManager.createDb(project, {}, false);
        const pouchdbDatastore = new PouchdbDatastore(db, new IdGenerator(), true);
        return new DocumentRepository(pouchdbManager, pouchdbDatastore);
    }

    public create = (doc: Document, username: string): Promise<Document> =>
        this.pouchdbDatastore.create(doc, username);

    
    public update = (doc: Document, username: string): Promise<Document> =>
        this.pouchdbDatastore.update(doc, username);


    public remove = (doc: Document): Promise<void> =>
        this.pouchdbDatastore.remove(doc);


    public fetch = (resourceId: string): Promise<Document> =>
        this.pouchdbDatastore.fetch(resourceId);

    
    public find = (query: Query): Promise<FindResult> => {
        throw Error('Not implemented yet');
    };


    public changed = (): Observable<Document> =>
        this.pouchdbDatastore.changesNotifications();


    public deleted = (): Observable<Document> =>
        this.pouchdbDatastore.deletedNotifications();


    public setupSync = (url: string, project: string): Promise<SyncProcess> =>
        this.pouchdbManager.setupSync(url, project);


    public stopSync = (): void =>
        this.pouchdbManager.stopSync();

}
