import {IdaiFieldDocument} from "../model/idai-field-document";
import {Datastore, Query, Filter} from "idai-components-2/datastore";
import {Document} from "idai-components-2/core";
import {Injectable} from "@angular/core";
import {IdGenerator} from "./id-generator";
import {Observable} from "rxjs/Observable";
import {Indexeddb} from "./indexeddb";
import {M} from "../m";
import {SearchTermExtractor} from "./search-term-extractor";

/**
 * @author Sebastian Cuy
 * @author Daniel M. de Oliveira
 */
@Injectable()
export class IndexeddbDatastore implements Datastore {

    private static IDAIFIELDOBJECT = 'idai-field-object';
    private static FULLTEXT = 'fulltext';

    private db: Promise<any>;
    private observers = [];
    private documentCache: { [resourceId: string]: Document } = {};
    
    constructor(private idb:Indexeddb){
        this.db=idb.db()
    };

    public create(document:any):Promise<string> {

        return new Promise((resolve, reject) => {
            if (document.id != null) reject("Aborting creation: Object already has an ID. " +
                "Maybe you wanted to update the object with update()?");
            document.id = IdGenerator.generateId();
            document['resource']['id'] = document.id;
            document.created = new Date();
            document.modified = document.created;
            this.documentCache[document['id']] = document;

            return this.saveDocument(document).then(() => {
                return this.saveFulltext(document);
            }, err => {
                    document.id = undefined;
                    document['resource']['id'] = undefined;
                    document.created = undefined;
                    document.modified = undefined;
                    reject(M.DATASTORE_IDEXISTS);
                }
            ).then(() => resolve(),
                err => reject(M.DATASTORE_GENERIC_SAVE_ERROR));
            });
    }

    public update(document:IdaiFieldDocument):Promise<any> {

        return new Promise((resolve, reject) => {
           if (document.id == null) reject("Aborting update: No ID given. " +
               "Maybe you wanted to create the object with create()?");
           document.modified = new Date();
           return this.saveDocument(document).then(() => {
               return this.saveFulltext(document);
           }, err => reject(M.DATASTORE_IDEXISTS)
           ).then(() => resolve(),
               err => reject(M.DATASTORE_GENERIC_SAVE_ERROR));
           });
    }

    public refresh(id:string):Promise<Document>  {
        return this.fetchObject(id);
    }

    public get(id:string):Promise<Document> {

        if (this.documentCache[id]) {
            return new Promise((resolve, reject) => resolve(this.documentCache[id]));
        } else {
            return this.fetchObject(id);
        }
    }

    public remove(id:string):Promise<any> {

        return new Promise((resolve, reject) => {
            this.db.then(db => {

                var objectRequest = db.remove(IndexeddbDatastore.IDAIFIELDOBJECT, id);
                objectRequest.onerror = event => reject(objectRequest.error);

                var fulltextRequest = db.remove(IndexeddbDatastore.FULLTEXT, id);
                fulltextRequest.onerror = event => reject(fulltextRequest.error);

                var promises = [];
                promises.push(objectRequest);
                promises.push(fulltextRequest);

                Promise.all(promises).then(
                    () => {
                        if (id) delete this.documentCache[id];
                        resolve();
                    }
                )
                .catch(
                    err => reject(err)
                );
            });
        });
    }

    public clear():Promise<any> {

        return new Promise((resolve, reject) => {
            this.db.then(db => {

                var objectRequest = db.clear(IndexeddbDatastore.IDAIFIELDOBJECT);
                objectRequest.onerror = event => reject(objectRequest.error);

                var fulltextRequest = db.clear(IndexeddbDatastore.FULLTEXT);
                fulltextRequest.onerror = event => reject(fulltextRequest.error);

                var promises = [];
                promises.push(objectRequest);
                promises.push(fulltextRequest);

                Promise.all(promises).then(
                    () => {
                        this.documentCache = {};
                        resolve();
                     }
                  )
                .catch(
                    err => reject(err)
                );
            });
        });
    }

    public documentChangesNotifications(): Observable<Document> {
        return Observable.create( observer => {
            this.observers.push(observer);
        });
    }

    public find(query: Query):Promise<Document[]> {

        var queryString = query.q.toLowerCase();

        return new Promise((resolve, reject) => {
            this.db.then(db => {

                var ids:string[] = [];

                // get a range that spans all index entries that start with the query string
                var range = IDBKeyRange.bound(queryString, queryString + '\uffff', false, true);
                var cursor = db.openCursor(IndexeddbDatastore.FULLTEXT, "terms", range);
                cursor.onsuccess = (event) => {
                    var cursor = event.target.result;
                    if (cursor) {
                        ids.push(cursor.value.id);
                        cursor.continue();
                    } else {
                        // make ids unique
                        ids = ids.filter((value, index, self) => (self.indexOf(value) === index));
                        this.buildResult(ids, query.filters).then( result => resolve(result) );
                    }
                };
                cursor.onerror = err => reject(cursor.error);
            })
        })
    }

    public all():Promise<Document[]> {

        return new Promise<Document[]>((resolve, reject) => {

            this.db.then(db => {

                var objects = [];

                var cursor = db.openCursor(IndexeddbDatastore.IDAIFIELDOBJECT,"modified",null, "prev");
                cursor.onsuccess = (event) => {
                    var cursor = event.target.result;
                    if (cursor) {
                        objects.push(this.getCachedInstance(cursor.value));
                        cursor.continue();
                    }
                    else resolve(objects);
                };
                cursor.onerror = err => reject(cursor.error);
            });
        });
    }

    private fetchObject(documentId:string): Promise<Document> {
        return new Promise((resolve, reject) => {
            this.db.then(db => {
                var request = db.get(IndexeddbDatastore.IDAIFIELDOBJECT,documentId);
                request.onerror = event => reject(request.error);
                request.onsuccess = event => {
                    var document:Document = request.result;

                    this.documentCache[documentId] = document;
                    resolve(document);
                }
            });
        });
    }

    private saveDocument(document:Document):Promise<any> {

        return new Promise((resolve, reject) => {
            this.db.then(db => {
                var request = db.put(IndexeddbDatastore.IDAIFIELDOBJECT,document);

                request.onerror = event => reject("databaseError");
                request.onsuccess = event => {
                    this.notifyObserversOfObjectToSync(document);
                    resolve(request.result);
                }
            });
        });
    }

    private saveFulltext(document:Document):Promise<any> {

        return new Promise((resolve, reject) => {
            this.db.then(db => {
                var request = db.put(IndexeddbDatastore.FULLTEXT,
                    {
                        id: document['id'],
                        terms: (new SearchTermExtractor).extractTerms(document['resource'])
                    }
                );
                request.onerror = event => reject(request.error);
                request.onsuccess = event => resolve(request.result);
            });
        });
    }

    private buildResult(ids: string[], filters): Promise<Document[]> {
        var promises:Promise<Document>[] = Array.from(ids).map(id => this.get(id));
        return Promise.all(promises).then( (docs: Document[]) => {
            var result = docs.filter( (doc: Document) => {
                return this.docMatchesFilters(filters, doc);
            });
            return result;
        });
    }

    private docMatchesFilters(filters: Filter[], doc: Document):boolean {
        if (!filters) return true;
        for (var filter of filters) {
            if (!filter) continue;
            if (filter.invert) {
                if ((filter.field in doc.resource) && doc.resource[filter.field] == filter.value) return false;
            } else {
                if (!(filter.field in doc.resource) || doc.resource[filter.field] != filter.value) return false;
            }
        }
        return true;
    }

    private notifyObserversOfObjectToSync(document:Document):void {
        
        this.observers.forEach( observer => {
            observer.next(document)
        } );
    }

    private getCachedInstance(document: any): Document {

        if (!this.documentCache[document['id']]) {
            this.documentCache[document['id']] = document;
        }

        return this.documentCache[document['id']];
    }

}
