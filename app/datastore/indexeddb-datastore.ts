import {IdaiFieldObject} from "../model/idai-field-object";
import {Datastore} from "./datastore";
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
    private objectCache: { [id: string]: IdaiFieldObject } = {};


    constructor(private idb:Indexeddb){
        this.db=idb.db()
    };


    public create(object:IdaiFieldObject):Promise<string> {

        return new Promise((resolve, reject) => {
            if (object.id != null) reject("Aborting creation: Object already has an ID. " +
                "Maybe you wanted to update the object with update()?");
            object.id = IdGenerator.generateId();
            object.created = new Date();
            object.modified = object.created;
            this.objectCache[object.id] = object;
            return Promise.all([this.saveObject(object), this.saveFulltext(object)])
                .then(() => resolve(object.id), err => {
                    object.id = undefined;
                    object.created = undefined;
                    object.modified = undefined;
                    reject(M.OBJLIST_IDEXISTS);
                });
        });
    }

    public update(object:IdaiFieldObject):Promise<any> {

        return new Promise((resolve, reject) => {
           if (object.id == null) reject("Aborting update: No ID given. " +
               "Maybe you wanted to create the object with create()?");
           object.modified = new Date();
           return Promise.all([this.saveObject(object), this.saveFulltext(object)])
               .then(() => resolve(), err => reject(M.OBJLIST_IDEXISTS));
        });
    }

    public refresh(id:string):Promise<IdaiFieldObject>  {

        return this.fetchObject(id);
    }

    public get(id:string):Promise<IdaiFieldObject> {

        if (this.objectCache[id]) {
            return new Promise((resolve, reject) => resolve(this.objectCache[id]));
        } else {
            return this.fetchObject(id);
        };
    }

    public delete(id:string):Promise<any> {

        return new Promise((resolve, reject) => {
            this.db.then(db => {

                var objectRequest = db.delete(IndexeddbDatastore.IDAIFIELDOBJECT,id);
                objectRequest.onerror = event => reject(objectRequest.error);

                var fulltextRequest = db.delete(IndexeddbDatastore.FULLTEXT,id);
                fulltextRequest.onerror = event => reject(fulltextRequest.error);

                var promises = [];
                promises.push(objectRequest);
                promises.push(fulltextRequest);

                Promise.all(promises).then(
                    () => {
                        if (this.objectCache[id]) delete this.objectCache[id];
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
                        this.objectCache = {};
                        resolve();
                     }
                  )
                .catch(
                    err => reject(err)
                );
            });
        });
    }

    public getUnsyncedObjects(): Observable<IdaiFieldObject> {

        return Observable.create( observer => {
            this.db.then(db => {

                var cursor = db.openCursor(IndexeddbDatastore.IDAIFIELDOBJECT,"synced",IDBKeyRange.only(0));
                cursor.onsuccess = (event) => {
                    var cursor = event.target.result;
                    if (cursor) {
                        observer.next(this.getCachedInstance(cursor.value));
                        cursor.continue();
                    } else {
                        this.observers.push(observer);
                    }
                };
                cursor.onerror = err => observer.onError(cursor.error);
            });
        });
    }

    public find(query:string):Promise<IdaiFieldObject[]> {

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
                        // console.log(Array.from(ids).map(id => this.get(id)));
                        var promises:Promise<IdaiFieldObject>[] = Array.from(ids).map(id => this.get(id));
                        resolve(Promise.all(promises));
                    }
                };
                cursor.onerror = err => reject(cursor.error);
            })
        })
    }

    public all():Promise<IdaiFieldObject[]> {

        return new Promise<IdaiFieldObject[]>((resolve, reject) => {

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

    private fetchObject(id:string): Promise<IdaiFieldObject> {

        return new Promise((resolve, reject) => {
            this.db.then(db => {
                var request = db.get(IndexeddbDatastore.IDAIFIELDOBJECT,id);
                request.onerror = event => reject(request.error);
                request.onsuccess = event => {
                    var object:IdaiFieldObject = request.result;
                    this.objectCache[object.id] = object;
                    resolve(object);
                }
            });
        });
    }

    private saveObject(object:IdaiFieldObject):Promise<any> {

        return new Promise((resolve, reject) => {
            this.db.then(db => {
                var request = db.put(IndexeddbDatastore.IDAIFIELDOBJECT,object);

                request.onerror = event => reject("databaseError");
                request.onsuccess = event => {
                    if (!object.synced) this.notifyObserversOfObjectToSync(object);
                    resolve(request.result);
                }
            });
        });
    }

    private saveFulltext(object:IdaiFieldObject):Promise<any> {

        return new Promise((resolve, reject) => {
            this.db.then(db => {
                var request = db.put(IndexeddbDatastore.FULLTEXT,
                    {
                        id: object.id,
                        terms: (new SearchTermExtractor).extractTerms(object)
                    }
                );
                request.onerror = event => reject(request.error);
                request.onsuccess = event => resolve(request.result);
            });
        })
    }

    

    private notifyObserversOfObjectToSync(object:IdaiFieldObject):void {
        
        this.observers.forEach( observer => observer.next(object) );
    }

    private getCachedInstance(object: IdaiFieldObject): IdaiFieldObject {

        if (!this.objectCache[object.id]) {
            this.objectCache[object.id] = object;
        }

        return this.objectCache[object.id];
    }

}
