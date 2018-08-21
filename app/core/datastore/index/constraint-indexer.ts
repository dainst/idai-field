import {Document, ProjectConfiguration, IdaiType, FieldDefinition} from 'idai-components-2';
import {IndexItem} from './index-item';
import {get} from 'tsfun';


export interface IndexDefinition {

    path: string;
    type: string;
}


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class ConstraintIndexer {

    private indexDefinitions: { [name: string]: IndexDefinition };

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
        defaultIndexDefinitions: { [name: string]: IndexDefinition },
        private projectConfiguration: ProjectConfiguration,
        private showWarnings = true
        ) {

        this.indexDefinitions = this.getIndexDefinitions(defaultIndexDefinitions);

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


    public get(indexName: string, matchTerms: string|string[]): Array<IndexItem> {

        const indexDefinition: IndexDefinition = this.indexDefinitions[indexName];
        if (!indexDefinition) throw 'Ignoring unknown constraint "' + indexName + '".';

        const matchedDocuments = this.getIndexItems(indexDefinition, matchTerms);
        if (!matchedDocuments) return [];

        return Object.keys(matchedDocuments).map(id => { return {
            id: id,
            date: matchedDocuments[id].date,
            identifier: matchedDocuments[id].identifier
        }});
    }


    private putFor(indexDefinition: IndexDefinition, doc: Document) {

        const elForPath = get(doc)(indexDefinition.path);

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
                if (!elForPath && elForPath !== false) break;
                ConstraintIndexer.addToIndex(this.matchIndex, doc, indexDefinition.path, elForPath.toString(),
                    this.showWarnings);
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


    private getIndexItems(indexDefinition: IndexDefinition,
                          matchTerms: string|string[]): { [id: string]: IndexItem }|undefined {

        return Array.isArray(matchTerms)
            ? this.getIndexItemsForMultipleMatchTerms(indexDefinition, matchTerms)
            : this.getIndexItemsForSingleMatchTerm(indexDefinition, matchTerms);
    }


    private getIndexItemsForMultipleMatchTerms(indexDefinition: IndexDefinition,
                                               matchTerms: string[]): { [id: string]: IndexItem }|undefined {

        const result = matchTerms.map(matchTerm => {
            return this.getIndexItemsForSingleMatchTerm(indexDefinition, matchTerm);
        }).reduce((result: any, indexItems) => {
            if (!indexItems) return result;
            Object.keys(indexItems).forEach(id => result[id] = indexItems[id]);
            return result;
        }, {});

        return Object.keys(result).length > 0 ? result : undefined;
    }


    private getIndexItemsForSingleMatchTerm(indexDefinition: IndexDefinition,
                                            matchTerm: string): { [id: string]: IndexItem }|undefined {

        return this.getIndex(indexDefinition)[indexDefinition.path][matchTerm];
    }


    private getIndexDefinitions(defaultIndexDefinitions: { [name: string]: IndexDefinition })
            : { [name: string]: IndexDefinition } {

        return Object.values(this.projectConfiguration.getTypesMap())
            .reduce((result: Array<FieldDefinition>, type: IdaiType) => {
                return result.concat(type.fields);
            }, [])
            .filter((field: FieldDefinition) => field.constraintIndexed)
            .filter((field: FieldDefinition, index: number, self: Array<FieldDefinition>) => {
                return self.indexOf(
                    self.find((f: FieldDefinition) => f.name === field.name) as FieldDefinition
                ) === index;
            })
            .map((field: FieldDefinition) => ConstraintIndexer.makeIndexDefinition(field))
            .reduce((result: any, definition: any) => {
                result[definition.name] = definition.indexDefinition;
                return result;
            }, defaultIndexDefinitions);
    }


    public static getDefaultIndexType(field: FieldDefinition): string {

        switch (field.inputType) {
            case 'checkboxes':
                return 'contain';
            default:
                return 'match';
        }
    }


    private static makeIndexDefinition(field: FieldDefinition)
            : { name: string, indexDefinition: IndexDefinition } {

        const indexType: string = this.getDefaultIndexType(field);

        return {
            name: field.name + ':' + indexType,
            indexDefinition: {
                path: 'resource.' + field.name,
                type: indexType
            }
        };
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