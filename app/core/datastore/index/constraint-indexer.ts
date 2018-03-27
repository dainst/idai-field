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


    constructor(
        private indexDefinitions: { [name: string]: IndexDefinition },
        private showWarnings = true
        ) {

        const validationError
            = ConstraintIndexer.validateIndexDefinitions(Object.values(this.indexDefinitions));
        if (validationError) throw validationError;

        this.setUp();
    }


    public clear = () => this.setUp();


    public put(doc: Document, skipRemoval: boolean = false) {

        if (!skipRemoval) this.remove(doc);
        for (let indexDefinition of Object.values(this.indexDefinitions)) {
            this.putFor(indexDefinition, doc);
        }
    }


    public remove(doc: Document) {

        Object.values(this.indexDefinitions)
            .map(definition => (this.getIndex(definition))[definition.path])
            .forEach(path =>
                Object.keys(path)
                    .filter(key => path[key][doc.resource.id as any])
                    .forEach(key => delete path[key][doc.resource.id as any])
            );
    }


    public get(indexName: string, matchTerm: string): Array<IndexItem> {

        const indexDefinition: IndexDefinition = this.indexDefinitions[indexName];
        if (!indexDefinition) throw 'Ignoring unknown constraint "' + indexName + '".';

        const index = this.getIndex(indexDefinition)[indexDefinition.path][matchTerm];
        if (!index) return [];

        return Object.keys(index).map(id => { return {
            id: id,
            date: index[id].date,
            identifier: index[id].identifier
        }});
    }


    private putFor(indexDefinition: IndexDefinition, doc: Document) {

        const elForPath = ObjectUtil.getElForPathIn(doc, indexDefinition.path);

        switch(indexDefinition.type) {
            case 'exist':
                if (!elForPath || (elForPath instanceof Array && (!elForPath.length || elForPath.length === 0))) {
                    return ConstraintIndexer.addToIndex(
                        this.existIndex,
                        doc,
                        indexDefinition.path, 'UNKNOWN',
                        this.showWarnings);
                }
                // this is a hack to make sure the project document is never listed as conflicted and can be removed when auto conflict resolving gets implemented.
                ConstraintIndexer.addToIndex(
                    this.existIndex,
                    doc,
                    indexDefinition.path,
                    doc.resource.type == 'Project' ? 'UNKNOWN' : 'KNOWN',
                    this.showWarnings);
                break;

            case 'match':
                ConstraintIndexer.addToIndex(this.matchIndex, doc, indexDefinition.path, elForPath, this.showWarnings);
                break;

            case 'contain':
                if (!elForPath) break;
                for (let target of elForPath) {
                    ConstraintIndexer.addToIndex(this.containIndex, doc, indexDefinition.path, target, this.showWarnings);
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
            case 'contain': return this.containIndex;
            case 'match':   return this.matchIndex;
            case 'exist':   return this.existIndex;
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


    private static addToIndex(
        index: any, doc: Document, path: string, target: string, showWarnings: boolean) {

        const indexItem = IndexItem.from(doc, showWarnings);
        if (!indexItem) return;

        if (!index[path][target]) index[path][target] = {};
        index[path][target][doc.resource.id as any] = indexItem;
    }
}