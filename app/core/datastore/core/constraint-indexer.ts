import {Document} from 'idai-components-2/core';
import {ObjectUtil} from '../../../util/object-util';
import {IndexItem} from './index-item';


export interface IndexDefinition {

    path: string;
    type: string;
}


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class ConstraintIndexer {

    private containIndex: {
        [path: string]: {
            [resourceId: string]: {
                [resourceId: string]: IndexItem
            }
        }
    };

    private matchIndex: {
        [path: string]: {
            [searchTerm: string]: {
                [resourceId: string]: IndexItem
            }
        }
    };

    private existIndex: {
        [path: string]: {
            [existence: string]: { // KNOWN | UNKNOWN
                [resourceId: string]: IndexItem
            }
        }
    };


    constructor(private indexDefinitions: { [name: string]: IndexDefinition }) {

        const validationError
            = ConstraintIndexer.validateIndexDefinitions(Object.values(this.indexDefinitions));
        if (validationError) throw validationError;

        this.setUp();
    }


    public clear() {

        this.setUp();
    }


    public put(doc: Document, skipRemoval: boolean = false) {

        if (!skipRemoval) this.remove(doc);
        for (let indexDefinition of Object.values(this.indexDefinitions)) {
            this.putFor(indexDefinition, doc);
        }
    }


    public remove(doc: Document) {

        for (let indexDefinition of Object.values(this.indexDefinitions)) {
            const index: any = this.getIndex(indexDefinition);

            for (let key of Object.keys(index[indexDefinition.path])) {
                if (index[indexDefinition.path][key][doc.resource.id as any]) {
                    delete index[indexDefinition.path][key][doc.resource.id as any];
                }
            }
        }
    }


    public get(indexName: string, matchTerm: string): any {

        const indexDefinition: IndexDefinition = this.indexDefinitions[indexName];

        if (!indexDefinition) {
            console.warn('Ignoring unknown constraint "' + indexName + '".');
            return undefined;
        }

        const result = this.getIndex(indexDefinition)[indexDefinition.path][matchTerm];
        if (!result) return [];

        return Object.keys(result).map(id => new Object({
            id: id,
            date: result[id].date,
            identifier: result[id].identifier
        }));
    }


    private putFor(indexDefinition: IndexDefinition, doc: Document) {

        const elForPath = ObjectUtil.getElForPathIn(doc, indexDefinition.path);

        switch(indexDefinition.type) {
            case 'exist':
                if (!elForPath || (elForPath instanceof Array && (!elForPath.length || elForPath.length === 0))) {
                    return ConstraintIndexer.addToIndex(this.existIndex, doc, indexDefinition.path, 'UNKNOWN');
                }

                // TODO remove as soon as auto conflict resolving is properly implemented. this is a hack to make sure the project document is never listed as conflicted
                if (doc.resource.type == 'Project') {
                    ConstraintIndexer.addToIndex(this.existIndex, doc, indexDefinition.path, 'UNKNOWN');
                } else {
                    ConstraintIndexer.addToIndex(this.existIndex, doc, indexDefinition.path, 'KNOWN');
                }
                break;

            case 'match':
                ConstraintIndexer.addToIndex(this.matchIndex, doc, indexDefinition.path, elForPath);
                break;

            case 'contain':
                if (!elForPath) break;
                for (let target of elForPath) {
                    ConstraintIndexer.addToIndex(this.containIndex, doc, indexDefinition.path, target);
                }
                break;
        }
    }


    private setUp() {

        this.containIndex = {};
        this.matchIndex = {};
        this.existIndex = {};

        for (let indexDefinition of Object.values(this.indexDefinitions)) {
            this.getIndex(indexDefinition)[indexDefinition.path] = {};
        }
    }


    private getIndex(indexDefinition: IndexDefinition): any {

        switch (indexDefinition.type) {
            case 'contain':
                return this.containIndex;
            case 'match':
                return this.matchIndex;
            case 'exist':
                return this.existIndex;
        }
    }


    private static validateIndexDefinitions(indexDefinitions: Array<IndexDefinition>): string|undefined {

        const types = ['match', 'contain', 'exist'];

        for (let indexDefinition of indexDefinitions) {
            if (!indexDefinition.type) return 'Index definition type is undefined';
            if (types.indexOf(indexDefinition.type) == -1) return 'Invalid paths definition type';
        }

        return undefined;
    }


    private static addToIndex(index: any, doc: Document, path: string, target: string) {

        const indexItem = IndexItem.from(doc);
        if (!indexItem) return;

        if (!index[path][target]) index[path][target] = {};
        index[path][target][doc.resource.id as any] = indexItem;
    }
}