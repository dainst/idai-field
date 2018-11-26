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


    constructor(defaultIndexDefinitions: { [name: string]: IndexDefinition },
                private projectConfiguration: ProjectConfiguration,
                private showWarnings = true) {

        this.indexDefinitions = ConstraintIndexer.getIndexDefinitions(
            defaultIndexDefinitions,
            Object.values(this.projectConfiguration.getTypesMap())
        );

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
                if ((!elForPath && elForPath !== false)
                        || (elForPath instanceof Array && (!elForPath.length || elForPath.length === 0))) {
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
                if ((!elForPath && elForPath !== false) || Array.isArray(elForPath)) break;
                ConstraintIndexer.addToIndex(this.matchIndex, doc, indexDefinition.path, elForPath.toString(),
                    this.showWarnings);
                break;

            case 'contain':
                if (!elForPath || !Array.isArray(elForPath)) break;
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


    public static getIndexType(field: FieldDefinition): string {

        switch (field.inputType) {
            case 'checkboxes':
                return 'contain';
            default:
                return 'match';
        }
    }


    private static getIndexDefinitions(defaultIndexDefinitions: { [name: string]: IndexDefinition },
                                       types: Array<IdaiType>): { [name: string]: IndexDefinition } {

        const definitionsFromConfiguration: Array<{ name: string, indexDefinition: IndexDefinition }> =
            this.getFieldsToIndex(types)
                .map((field: FieldDefinition) => ConstraintIndexer.makeIndexDefinitions(field))
                .reduce((result: any, definitions) => {
                    definitions.forEach(definition => result.push(definition));
                    return result;
                }, []);

        return this.combine(definitionsFromConfiguration, defaultIndexDefinitions);
    }


    private static getFieldsToIndex(types: Array<IdaiType>): Array<FieldDefinition> {

        const fields: Array<FieldDefinition> =
            (types.reduce((result: Array<FieldDefinition>, type: IdaiType) => {
                return result.concat(type.fields);
            }, []) as any).filter((field: FieldDefinition) => field.constraintIndexed);

        return this.getUniqueFields(fields);
    }


    private static getUniqueFields(fields: Array<FieldDefinition>): Array<FieldDefinition> {

        return fields
            .filter((field: FieldDefinition, index: number, self: Array<FieldDefinition>) => {
                return self.indexOf(
                    self.find((f: FieldDefinition) => {
                        return this.resultsInSameIndexDefinition(f, field);
                    }) as FieldDefinition
                ) === index;
            });
    }


    private static resultsInSameIndexDefinition(field1: FieldDefinition, field2: FieldDefinition): boolean {

        return field1.name === field2.name
            && ConstraintIndexer.getIndexType(field1) === ConstraintIndexer.getIndexType(field2);
    }


    private static makeIndexDefinitions(field: FieldDefinition)
            : Array<{ name: string, indexDefinition: IndexDefinition }> {

        return [
            this.makeIndexDefinition(field, this.getIndexType(field)),
            this.makeIndexDefinition(field, 'exist')
        ];
    }


    private static makeIndexDefinition(field: FieldDefinition, indexType: string)
            : { name: string, indexDefinition: IndexDefinition } {

        return {
            name: field.name + ':' + indexType,
            indexDefinition: {
                path: 'resource.' + field.name,
                type: indexType
            }
        };
    }


    private static combine(indexDefinitionsFromConfiguration
                               : Array<{ name: string, indexDefinition: IndexDefinition }>,
                           defaultIndexDefinitions: { [name: string]: IndexDefinition }) {

        return indexDefinitionsFromConfiguration.reduce((result: any, definition: any) => {
            result[definition.name] = definition.indexDefinition;
            return result;
        }, defaultIndexDefinitions);
    }


    private static validateIndexDefinitions(indexDefinitions: Array<IndexDefinition>): string|undefined {

        const types = ['match', 'contain', 'exist'];

        for (let indexDefinition of indexDefinitions) {
            if (!indexDefinition.type) return 'Index definition type is undefined';
            if (types.indexOf(indexDefinition.type) == -1) return 'Invalid paths definition type';
        }

        return undefined;
    }


    private static addToIndex(index: any, doc: Document, path: string, target: string,
                              showWarnings: boolean) {

        const indexItem = IndexItem.from(doc, showWarnings);
        if (!indexItem) return;

        if (!index[path][target]) index[path][target] = {};
        index[path][target][doc.resource.id as any] = indexItem;
    }
}