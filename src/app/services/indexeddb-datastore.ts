import {IdaiFieldObject} from "../model/idai-field-object";
import {Datastore} from "./datastore";
import {Injectable} from "angular2/core";

@Injectable()
export class IndexeddbDatastore implements Datastore {

    private db: Promise<any>;

    constructor() {


    }

    initialize():Promise<any> {

        this.db = new Promise((resolve, reject) => {
            var request = indexedDB.open("IdaiFieldClient", 1);
            request.onerror = (event) => {
                console.error("Could not create IndexedDB!", event);
                reject(event);
            };
            request.onsuccess = (event) => {
                resolve(request.result);
            };
            request.onupgradeneeded = (event) => {
                var db = request.result;
                db.createObjectStore("idai-field-object", { keyPath: "_id" });
            };
        });
        return this.db;
    }

    save(object:IdaiFieldObject):Promise<any> {

        console.log("save");

        return new Promise((resolve, reject) => {
            this.db.then(db => {
                var objectStore = db.transaction(['idai-field-object'], 'readwrite').objectStore('idai-field-object');
                var request = objectStore.put(object);
                request.onerror = event => reject(event);
                request.onsuccess = event => resolve(request.result);
            });
        });
    }

    get(id:string):Promise<IdaiFieldObject> {

        return new Promise((resolve, reject) => {
            this.db.then(db => {
                var request = db.transaction(['idai-field-object']).objectStore('idai-field-object').get(id);
                request.onerror = event => reject(event);
                request.onsuccess = event => resolve(request.result);
            });
        });
    }

    delete(id:string):Promise<any> {

        return new Promise((resolve, reject) => {
            this.db.then(db => {
                var request = db.transaction(['idai-field-object'], 'readwrite')
                    .objectStore('idai-field-object').delete(id);
                request.onerror = event => reject(event);
                request.onsuccess = event => resolve(request.result);
            });
        });
    }

    find(query:string, options:any):Promise<IdaiFieldObject[]> {

        // TODO implement based on indexes
        return new Promise(resolve => resolve([]));
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
                cursor.onerror = err => reject(err);
            });
        });
    }

}