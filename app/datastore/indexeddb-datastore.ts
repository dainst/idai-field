import {IdaiFieldDocument} from "../model/idai-field-document";
import {Document} from "idai-components-2/idai-components-2";
import {Datastore} from "idai-components-2/idai-components-2";
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
            document['resource']['@id']="/"+document['resource'].type+"/"+document.id;
            document.created = new Date();
            document.modified = document.created;
            this.documentCache[document['id']] = document;

            return Promise.all([this.saveDocument(document), this.saveFulltext(document)])
                .then(() => resolve(document['resource']['@id']), err => {
                    
                    document.id = undefined;
                    document['resource']['@id'] = undefined;
                    document.created = undefined;
                    document.modified = undefined;
                    reject(M.OBJLIST_IDEXISTS);
                });
        });
    }

    public update(document:IdaiFieldDocument):Promise<any> {

        return new Promise((resolve, reject) => {
           if (document.id == null) reject("Aborting update: No ID given. " +
               "Maybe you wanted to create the object with create()?");
           document.modified = new Date();
           return Promise.all([this.saveDocument(document), this.saveFulltext(document)])
               .then(() => resolve(), err => reject(M.OBJLIST_IDEXISTS));
        });
    }

    public refresh(id:string):Promise<Document>  {
        return this.fetchObject(id);
    }

    public get(resourceId:string):Promise<Document> {

        let docId = this.documentIdFrom(resourceId);

        if (this.documentCache[docId]) {
            return new Promise((resolve, reject) => resolve(this.documentCache[docId]));
        } else {
            return this.fetchObject(docId);
        }
    }

    private documentIdFrom(resourceId){
        var result=resourceId.replace(/\/.*\//,"")
        return result;
    }

    public remove(resourceId:string):Promise<any> {

        return new Promise((resolve, reject) => {
            this.db.then(db => {

                var docId = this.documentIdFrom(resourceId);

                var objectRequest = db.remove(IndexeddbDatastore.IDAIFIELDOBJECT, docId);
                objectRequest.onerror = event => reject(objectRequest.error);

                var fulltextRequest = db.remove(IndexeddbDatastore.FULLTEXT, docId);
                fulltextRequest.onerror = event => reject(fulltextRequest.error);

                var promises = [];
                promises.push(objectRequest);
                promises.push(fulltextRequest);

                Promise.all(promises).then(
                    () => {
                        if (docId) delete this.documentCache[docId];
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

    public find(query:string):Promise<Document[]> {

        query = query.toLowerCase();

        return new Promise((resolve, reject) => {
            this.db.then(db => {

                var ids:string[] = [];

                var range = IDBKeyRange.bound(query, query + '\uffff', false, true);
                var cursor = db.openCursor(IndexeddbDatastore.FULLTEXT, "terms", range);
                cursor.onsuccess = (event) => {
                    var cursor = event.target.result;
                    if (cursor) {
                        ids.push(cursor.value.id);
                        cursor.continue();
                    } else {
                        // make ids unique
                        ids = ids.filter((value, index, self) => (self.indexOf(value) === index));
                        var promises:Promise<Document>[] = Array.from(ids).map(id => this.get(id));
                        resolve(Promise.all(promises));
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
        })
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
