import {Document} from 'idai-components-2/core';
import {ObjectUtil} from '../util/object-util';
import {ChangeHistoryUtil} from '../model/change-history-util';

/**
 * @author Daniel de Oliveira
 */
export class ConstraintIndexer {

    private index: {
        [path: string]: {
            [resourceId: string]: {
                [resourceId: string]: {
                    date: Date,
                    identifier: string
                }
            }
        }
    };

    constructor(private pathsDefinitions) {

        this.setUp();
    }

    public clear() {

        this.setUp();
    }

    public put(doc: Document, skipRemoval: boolean = false) {

        if (!skipRemoval) this.remove(doc);
        for (let pathDef of this.pathsDefinitions) {
            this.putFor(pathDef, doc);
        }
    }

    public remove(doc: Document) {

        for (let pathDef of this.pathsDefinitions) {
            for (let key of Object.keys(this.index[pathDef.path])) {
                if (this.index[pathDef.path][key][doc.resource.id]) {
                    delete this.index[pathDef.path][key][doc.resource.id];
                }
            }
        }
    }

    public get(path: string, matchTerm: string): any {

        if (!this.hasIndex(path)) {
            console.warn('ignoring unknown constraint "' + path + '"');
            return undefined;
        }

        const result = this.index[path][matchTerm];
        if (result) {
            return Object.keys(result).map(id => new Object({
                id: id,
                date: result[id].date,
                identifier: result[id].identifier
            }));
        } else {
            return [];
        }
    }

    private putFor(pathDef, doc: Document) {

        const elForPath = ObjectUtil.getElForPathIn(doc, pathDef.path);

        if (!elForPath) {
            return this.addToIndex(doc, pathDef.path, 'UNKNOWN');
        }

        // TODO use type instead of boolean or string or array (default)
        if (pathDef.boolean) {
            this.addToIndex(doc, pathDef.path, 'KNOWN');
        } else if (pathDef.string) {
            this.addToIndex(doc, pathDef.path, elForPath);
        } else {
            for (let target of elForPath) {
                this.addToIndex(doc, pathDef.path, target);
            }
        }
    }

    private hasIndex(path: string) {

        for (let pd of this.pathsDefinitions) {
            if (pd.path == path) return true;
        }
        return false;
    }

    private addToIndex(doc: Document, path: string, target: string) {

        if (!this.index[path][target]) this.index[path][target] = {};
        this.index[path][target][doc.resource.id] = {
            date: ChangeHistoryUtil.getLastModified(doc).date,
            identifier: doc.resource['identifier']
        };
    }

    private setUp() {

        this.index = { };
        for (let pathDefinition of this.pathsDefinitions) {
            this.index[pathDefinition.path] = { };
        }
    }
}