import {IdaiFieldObject} from "../model/idai-field-object";
import {Datastore} from "./datastore";
import {Injectable} from "angular2/core";
import {IdGenerator} from "./id-generator";
import {Observable} from "rxjs/Observable";
import {Observer} from "rxjs/Observer";

@Injectable()
export class IndexeddbDatastore implements Datastore {

    private db: Promise<any>;
    private observers = [];
    private objectCache: { [id: string]: IdaiFieldObject } = {};

    constructor() {

        this.db = new Promise((resolve, reject) => {

            var request = indexedDB.open("IdaiFieldClient", 12);
            request.onerror = (event) => {
                console.error("Could not create IndexedDB! Error: ", request.error.name);
                reject(request.error);
            };
            request.onsuccess = (event) => {
                resolve(request.result);
            };
            request.onupgradeneeded = (event) => {
                var db = request.result;

                if (db.objectStoreNames.length > 0) {
                    db.deleteObjectStore("idai-field-object");
                    db.deleteObjectStore("fulltext");
                }

                var objectStore = db.createObjectStore("idai-field-object", { keyPath: "id" });
                objectStore.createIndex("identifier", "identifier", { unique: true } );
                objectStore.createIndex("synced", "synced", { unique: false });
                objectStore.createIndex("modified", "modified");
                objectStore.createIndex("created", "created");
                objectStore.createIndex("title", "title");
                var fulltextStore = db.createObjectStore("fulltext", { keyPath: "id" });
                fulltextStore.createIndex("terms", "terms", { multiEntry: true } );
            };
        });
    }

    create(object:IdaiFieldObject):Promise<string> {

        return new Promise((resolve, reject) => {
            if (object.id != null) reject("Aborting creation: Object already has an ID. " +
                "Maybe you wanted to update the object with update()?");
            object.id = IdGenerator.generateId();
            object.created = new Date();
            object.modified = object.created;
            this.objectCache[object.id] = object;
            return Promise.all([this.saveObject(object), this.saveFulltext(object)])
                .then(() => resolve(object.id), err => reject(err));
        });
    }

    update(object:IdaiFieldObject):Promise<any> {

        return new Promise((resolve, reject) => {
           if (object.id == null) reject("Aborting update: No ID given. " +
               "Maybe you wanted to create the object with create()?");
           object.modified = new Date();
           return Promise.all([this.saveObject(object), this.saveFulltext(object)])
               .then(() => resolve(), err => reject(err));;
        });
    }

    refresh(id:string):Promise<IdaiFieldObject>  {

        return this.fetchObject(id);
    }

    get(id:string):Promise<IdaiFieldObject> {

        if (this.objectCache[id]) {
            return new Promise((resolve, reject) => resolve(this.objectCache[id]));
        } else {
            return this.fetchObject(id);
        };
    }

    delete(id:string):Promise<any> {

        return new Promise((resolve, reject) => {
            this.db.then(db => {

                var objectRequest = db.transaction(['idai-field-object'], 'readwrite')
                    .objectStore('idai-field-object').delete(id);
                objectRequest.onerror = event => reject(objectRequest.error);

                var fulltextRequest = db.transaction(['fulltext'], 'readwrite')
                    .objectStore('fulltext').delete(id);
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

    getUnsyncedObjects(): Observable<IdaiFieldObject> {

        return Observable.create( observer => {
            this.db.then(db => {

                var cursor = db.transaction(['idai-field-object']).objectStore('idai-field-object')
                    .index("synced").openCursor(IDBKeyRange.only(0));
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

    find(query:string, options:any):Promise<IdaiFieldObject[]> {

        // TODO implement query options

        query = query.toLowerCase();

        return new Promise<string[]>((resolve, reject) => {

            this.db.then(db => {

                var ids:string[] = [];

                var range = IDBKeyRange.bound(query, query+'\uffff', false, true);
                var cursor = db.transaction(['fulltext'])
                    .objectStore('fulltext').index("terms").openCursor(range);
                cursor.onsuccess = (event) => {
                    var cursor = event.target.result;
                    if (cursor) {
                        ids.push(cursor.value.id);
                        cursor.continue();
                    } else {
                        // make ids unique
                        ids = ids.filter( (value, index, self) => (self.indexOf(value) === index) );
                        resolve(ids);
                    }
                };
                cursor.onerror = err => reject(cursor.error);
            });
        }).then( ids => {
            var promises:Promise<IdaiFieldObject>[] = Array.from(ids).map( id => this.get(id) );
            return Promise.all(promises);
        });
    }

    all(options:any):Promise<IdaiFieldObject[]> {

        // TODO implement query options

        return new Promise<IdaiFieldObject[]>((resolve, reject) => {

            this.db.then(db => {

                var objects = [];

                var objectStore = db.transaction(['idai-field-object']).objectStore('idai-field-object');
                var cursor = objectStore.index("modified").openCursor(null, "prev");
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
                var request = db.transaction(['idai-field-object']).objectStore('idai-field-object').get(id);
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

                var request = db.transaction(['idai-field-object'], 'readwrite')
                    .objectStore('idai-field-object').put(object);

                request.onerror = event => reject(request.error);
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
                var terms = IndexeddbDatastore.extractTerms(object);
                var request = db.transaction(['fulltext'], 'readwrite')
                    .objectStore('fulltext').put({ id: object.id, terms: terms});
                request.onerror = event => reject(request.error);
                request.onsuccess = event => resolve(request.result);
            });
        })
    }

    private static extractTerms(object:IdaiFieldObject):string[] {

        var terms = [];
        for (var property in object) {
            if (object.hasOwnProperty(property)) {
                if (typeof object[property] == "string" && object[property].length > 0) {
                    terms = terms.concat(this.tokenize(object[property]));
                }
            }
        }
        return terms.map( term => term.toLowerCase());
    }

    private static tokenize(string:string):string[] {

        return string.match(/\w+/g);
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