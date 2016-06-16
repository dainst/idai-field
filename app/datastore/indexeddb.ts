import {Injectable} from "@angular/core";

/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
@Injectable()
export class Indexeddb {

    public db() : Promise<any> {

        return new Promise((resolve, reject) => {

            var request = indexedDB.open("IdaiFieldClient", 23);
            request.onerror = (event) => {
                console.error("Could not create IndexedDB! Error: ", request.error.name);
                reject(request.error);
            };

            request.onsuccess = (event) => {

                request.result.put = function (name, what) {
                    return request.result.transaction([name], 'readwrite')
                        .objectStore(name).put(what);
                };

                request.result.remove = function (name, what) {
                    return request.result.transaction([name], 'readwrite')
                        .objectStore(name).delete(what)
                };

                request.result.clear = function (name) {
                    return request.result.transaction([name], 'readwrite')
                        .objectStore(name).clear()
                };

                request.result.get = function (name, what) {
                    return request.result.transaction([name], 'readwrite')
                        .objectStore(name).get(what)
                };

                request.result.openCursor = function (name,index, what,what2) {
                    return request.result.transaction([name], 'readwrite')
                        .objectStore(name).index(index).openCursor(what,what2);
                };



                resolve(request.result);
            };


            request.onupgradeneeded = (event) => {
                var db = request.result;

                if (db.objectStoreNames.length > 0) {
                    db.deleteObjectStore("idai-field-object");
                    db.deleteObjectStore("fulltext");
                }

                var objectStore = db.createObjectStore("idai-field-object", {keyPath: "id"});
                objectStore.createIndex("identifier", "resource.identifier", {unique: true});
                objectStore.createIndex("synced", "synced", {unique: false});
                objectStore.createIndex("modified", "modified");
                objectStore.createIndex("created", "created");
                objectStore.createIndex("title", "resource.title");
                var fulltextStore = db.createObjectStore("fulltext", {keyPath: "id"});
                fulltextStore.createIndex("terms", "terms", {multiEntry: true});
            };
        });
    }
}