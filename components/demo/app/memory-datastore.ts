import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {Document} from '../../src/core/model/document';
import {Query} from '../../src/core/datastore/query';
import {Datastore} from '../../src/core/datastore/datastore';
import {FindResult} from '../../src/core/datastore/read-datastore';

/**
 * @author Daniel de Oliveira
 */
@Injectable()
export class MemoryDatastore implements Datastore {

    private db: Promise<any>;
    private objectCache: { [id: string]: Document } = {};


    constructor() {};


    public getUnsyncedObjects(): Observable<Document>|undefined {

        return undefined;
    }


    // NOT IMPLEMENTED
    public remoteChangesNotifications(): Observable<Document>|undefined {

        return undefined;
    }


    public create(document: Document): Promise<Document> {

        this.objectCache[document.resource.id as any] = document;
        return Promise.resolve(document);
    }


    public update(document: Document): Promise<Document> {

        this.objectCache[document.resource.id as any] = document;
        return Promise.resolve(document);
    }


    public refresh(document: Document): Promise<Document|undefined> {

        return Promise.resolve(undefined);
    }


    public get(id: string): Promise<Document> {

        return new Promise<Document>((resolve, reject) => {
            if (!this.objectCache[id]) reject('document not found');
            resolve(this.objectCache[id]);
        });
    }


    public remove(document: Document): Promise<any> {

        return Promise.resolve();
    }


    public clear(): Promise<any> {

        return new Promise((resolve, reject) => {
            this.db.then(db => {
                resolve();
            });
        });
    }


    public find(query: Query): Promise<FindResult> {

        if (!query.q) query.q = '';
        const queryString = query.q.toLowerCase();

        const results: Document[] = [];
        for (let i in this.objectCache) {
            if ((this.objectCache[i].resource.id as any).indexOf(queryString) != -1) results.push(this.objectCache[i]);
        }

        return Promise.resolve({
            documents: results,
            totalCount: results.length
        });
    }


    public all(): Promise<Document[]> {

        return new Promise<Document[]>((resolve, reject) => {
            resolve();
        });
    }
}
