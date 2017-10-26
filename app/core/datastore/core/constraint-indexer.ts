import {Document, Action} from 'idai-components-2/core';
import {ObjectUtil} from '../../../util/object-util';
import {ChangeHistoryUtil} from '../../model/change-history-util';

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


    constructor(private pathsDefinitions: any) {

        const validationError = ConstraintIndexer.validatePathsDefinitions(pathsDefinitions);
        if (validationError) throw validationError;

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
                if (this.index[pathDef.path][key][doc.resource.id as any]) {
                    delete this.index[pathDef.path][key][doc.resource.id as any];
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


    private putFor(pathDef: any, doc: Document) {

        const elForPath = ObjectUtil.getElForPathIn(doc, pathDef.path);

        if (!elForPath) {
            return this.addToIndex(doc, pathDef.path, 'UNKNOWN');
        }

        switch(pathDef.type) {
            case 'exist':
                // TODO remove as soon as auto conflict resolving is properly implemented. this is a hack to make sure the project document is never listed as conflicted
                if (doc.resource.type == 'Project') {
                    this.addToIndex(doc, pathDef.path, 'UNKNOWN');
                } else {
                    this.addToIndex(doc, pathDef.path, 'KNOWN');
                }
                break;

            case 'match':
                this.addToIndex(doc, pathDef.path, elForPath);
                break;

            case 'contain':
                for (let target of elForPath) {
                    this.addToIndex(doc, pathDef.path, target);
                }
                break;
        }
    }


    private hasIndex(path: string) {

        for (let pd of this.pathsDefinitions) {
            if (pd.path == path) return true;
        }
        return false;
    }


    private addToIndex(doc: Document, path: string, target: string) {

        const lastModified: Action = ChangeHistoryUtil.getLastModified(doc);
        if (!lastModified) {
            console.warn('ConstraintIndexer: Failed to index document. ' +
                'The document does not contain a created/modified action.', doc);
            return;
        }

        if (!this.index[path][target]) this.index[path][target] = {};
        this.index[path][target][doc.resource.id as any] = {
            date: lastModified.date,
            identifier: doc.resource['identifier']
        } as any;
    }

    private static validatePathsDefinitions(pathsDefinitions: any): string|undefined {

        const types = ['match', 'contain', 'exist'];

        for (let pathsDefinition of pathsDefinitions) {
            if (!pathsDefinition.type) return 'paths definition type is undefined';
            if (types.indexOf(pathsDefinition.type) == -1) return 'invalid paths definition type';
        }

        return undefined;
    }

    private setUp() {

        this.index = { };
        for (let pathDefinition of this.pathsDefinitions) {
            this.index[pathDefinition.path] = { };
        }
    }
}