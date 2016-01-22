import {IdaiFieldObject} from "../model/idai-field-object";
import {Datastore} from "./datastore";
import {Injectable} from "angular2/core";
import {IdGenerator} from "./id-generator";
import {IdaiObserver} from "../idai-observer";
import {IdaiObservable} from "../idai-observable";

@Injectable()
export class IndexeddbDatastore implements Datastore {

    private db: Promise<any>;
    private observers : IdaiObserver[] = [];

    constructor() {

        this.db = new Promise((resolve, reject) => {
            var request = indexedDB.open("IdaiFieldClient", 5);
            request.onerror = (event) => {
                console.error("Could not create IndexedDB!", event);
                reject(request.error);
            };
            request.onsuccess = (event) => {
                resolve(request.result);
            };
            request.onupgradeneeded = (event) => {
                var db = request.result;
                db.deleteObjectStore("idai-field-object");
                db.deleteObjectStore("fulltext");
                var objectStore = db.createObjectStore("idai-field-object", { keyPath: "_id" });
                objectStore.createIndex("identifier", "identifier", { unique: true } );
                var fulltextStore = db.createObjectStore("fulltext", { keyPath: "_id" });
                fulltextStore.createIndex("terms", "terms", { multiEntry: true } );
            };
        });
    }

    subscribe(observer: IdaiObserver) {
        this.observers.push(observer);
    }

    notifyObservers() {
        for (var observer of this.observers) {
            observer.notify();
        }
    }


    create(object:IdaiFieldObject):Promise<string> {

        return new Promise((resolve, reject) => {
            if (object._id != null) reject("Aborting creation: Object already has an ID. " +
                "Maybe you wanted to update the object with update()?");
            object._id = IdGenerator.generateId();
            return Promise.all([this.saveObject(object), this.saveFulltext(object)])
                .then(() => resolve(object._id), err => reject(err));
        });
    }

    update(object:IdaiFieldObject):Promise<any> {

        return new Promise((resolve, reject) => {
           if (object._id == null) reject("Aborting update: No ID given. " +
               "Maybe you wanted to create the object with create()?");
           return Promise.all([this.saveObject(object), this.saveFulltext(object)])
               .then(() => resolve(), err => reject(err));;
        });
    }

    get(id:string):Promise<IdaiFieldObject> {

        return new Promise((resolve, reject) => {
            this.db.then(db => {
                var request = db.transaction(['idai-field-object']).objectStore('idai-field-object').get(id);
                request.onerror = event => reject(request.error);
                request.onsuccess = event => resolve(request.result);
            });
        });
    }

    delete(id:string):Promise<any> {

        return new Promise((resolve, reject) => {
            this.db.then(db => {
                var request = db.transaction(['idai-field-object'], 'readwrite')
                    .objectStore('idai-field-object').delete(id);
                request.onerror = event => reject(request.error);
                request.onsuccess = event => {
                    this.notifyObservers();
                    resolve(request.result);
                }
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
                        ids.push(cursor.value.identifier);
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
                var cursor = objectStore.openCursor();
                cursor.onsuccess = (event) => {
                    var cursor = event.target.result;
                    if (cursor) {
                        objects.push(cursor.value);
                        cursor.continue();
                    }
                    else {
                        resolve(objects);
                    }
                };
                cursor.onerror = err => reject(cursor.error);
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
                    this.notifyObservers();
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
                    .objectStore('fulltext').put({ _id: object._id, terms: terms});
                request.onerror = event => reject(request.error);
                request.onsuccess = event => resolve(request.result);
            });
        })
    }

    private static extractTerms(object:IdaiFieldObject):string[] {
        var terms = [];
        for (var property in object) {
            if (object.hasOwnProperty(property)) {
                if (typeof object[property] == "string") {
                    terms = terms.concat(this.tokenize(object[property]));
                }
            }
        }
        return terms.map( term => term.toLowerCase());
    }

    private static tokenize(string:string):string[] {
        return string.match(/\w+/g);
    }

}