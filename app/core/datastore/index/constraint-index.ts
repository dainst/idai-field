import {Document, FieldDefinition, IdaiType} from 'idai-components-2';
import {IndexItem} from './index-item';
import {getOrElse} from 'tsfun';


export interface IndexDefinition {

    path: string;
    type: string;
}


export interface ConstraintIndex {

    showWarnings: boolean;

    indexDefinitions: { [name: string]: IndexDefinition };

    containIndex: {
        [path: string]: {
            [resourceId: string]: {
                [resourceId: string]: IndexItem
            }
        }
    };

    matchIndex: {
        [path: string]: {
            [searchTerm: string]: {
                [resourceId: string]: IndexItem
            }
        }
    };

    existIndex: {
        [path: string]: {
            [existence: string]: { // KNOWN | UNKNOWN
                [resourceId: string]: IndexItem
            }
        }
    };
}



/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module ConstraintIndex {

    export function make(defaultIndexDefinitions: { [name: string]: IndexDefinition },
                         typesMap: { [typeName: string]: IdaiType }, showWarnings: boolean = true) {

        const constraintIndex: ConstraintIndex = {
            showWarnings: true,
            indexDefinitions: {}, containIndex: {}, existIndex: {}, matchIndex: {}};

        constraintIndex.indexDefinitions = getIndexDefinitions(
            defaultIndexDefinitions,
            Object.values(typesMap)
        );

        const validationError = validateIndexDefinitions(Object.values(constraintIndex.indexDefinitions));
        if (validationError) throw validationError;

        setUp(constraintIndex);
        constraintIndex.showWarnings = showWarnings;
        return constraintIndex;
    }


    export const clear = (constraintIndex: ConstraintIndex) => setUp(constraintIndex);


    export function put(constraintIndex: ConstraintIndex, doc: Document, skipRemoval: boolean = false) {

        if (!skipRemoval) remove(constraintIndex, doc);
        for (let indexDefinition of Object.values(constraintIndex.indexDefinitions)) {
            putFor(constraintIndex, indexDefinition, doc);
        }
    }


    export function remove(constraintIndex: ConstraintIndex, doc: Document) {

        Object.values(constraintIndex.indexDefinitions)
            .map(definition => (getIndex(constraintIndex, definition))[definition.path])
            .forEach(path =>
                Object.keys(path)
                    .filter(key => path[key][doc.resource.id as any])
                    .forEach(key => delete path[key][doc.resource.id as any])
            );
    }


    export function get(constraintIndex: ConstraintIndex, indexName: string,
                        matchTerms: string|string[]): Array<IndexItem> {

        const indexDefinition: IndexDefinition = constraintIndex.indexDefinitions[indexName];
        if (!indexDefinition) throw 'Ignoring unknown constraint "' + indexName + '".';

        const matchedDocuments = getIndexItems(constraintIndex, indexDefinition, matchTerms);
        if (!matchedDocuments) return [];

        return Object.keys(matchedDocuments).map(id => { return {
            id: id,
            date: matchedDocuments[id].date,
            identifier: matchedDocuments[id].identifier
        }});
    }


    export function getCount(constraintIndex: ConstraintIndex, indexName: string, matchTerm: string): number {

        const indexDefinition: IndexDefinition = constraintIndex.indexDefinitions[indexName];
        if (!indexDefinition) throw 'Ignoring unknown constraint "' + indexName + '".';

        const indexItems: { [id: string]: IndexItem }|undefined
            = getIndexItemsForSingleMatchTerm(constraintIndex, indexDefinition, matchTerm);

        return indexItems
            ? Object.keys(indexItems).length
            : 0;
    }


    function putFor(constraintIndex: ConstraintIndex,
                    indexDefinition: IndexDefinition,
                    doc: Document) {

        const elForPath = getOrElse(doc, undefined)(indexDefinition.path);

        switch(indexDefinition.type) {
            case 'exist':
                if ((!elForPath && elForPath !== false)
                        || (elForPath instanceof Array && (!elForPath.length || elForPath.length === 0))) {
                    return addToIndex(
                        constraintIndex.existIndex,
                        doc,
                        indexDefinition.path, 'UNKNOWN',
                        constraintIndex.showWarnings);
                }
                // this is a hack to make sure the project document is never listed as conflicted and can be removed when auto conflict resolving gets implemented.
                addToIndex(
                    constraintIndex.existIndex,
                    doc,
                    indexDefinition.path,
                    doc.resource.type == 'Project' ? 'UNKNOWN' : 'KNOWN',
                    constraintIndex.showWarnings);
                break;

            case 'match':
                if ((!elForPath && elForPath !== false) || Array.isArray(elForPath)) break;
                addToIndex(constraintIndex.matchIndex, doc, indexDefinition.path, elForPath.toString(),
                    constraintIndex.showWarnings);
                break;

            case 'contain':
                if (!elForPath || !Array.isArray(elForPath)) break;
                for (let target of elForPath) {
                    addToIndex(constraintIndex.containIndex, doc, indexDefinition.path, target, constraintIndex.showWarnings);
                }
                break;
        }
    }


    function setUp(constraintIndex: ConstraintIndex) {

        constraintIndex.containIndex = {};
        constraintIndex.matchIndex = {};
        constraintIndex.existIndex = {};

        for (let indexDefinition of Object.values(constraintIndex.indexDefinitions)) {
            getIndex(constraintIndex, indexDefinition)[indexDefinition.path] = {};
        }
    }


    function getIndex(constraintIndex: ConstraintIndex, indexDefinition: IndexDefinition): any {

        switch (indexDefinition.type) {
            case 'contain': return constraintIndex.containIndex;
            case 'match':   return constraintIndex.matchIndex;
            case 'exist':   return constraintIndex.existIndex;
        }
    }


    function getIndexItems(constraintIndex: ConstraintIndex, indexDefinition: IndexDefinition,
                           matchTerms: string|string[]): { [id: string]: IndexItem }|undefined {

        return Array.isArray(matchTerms)
            ? getIndexItemsForMultipleMatchTerms(constraintIndex, indexDefinition, matchTerms)
            : getIndexItemsForSingleMatchTerm(constraintIndex, indexDefinition, matchTerms);
    }


    function getIndexItemsForMultipleMatchTerms(constraintIndex: ConstraintIndex,
                                                indexDefinition: IndexDefinition,
                                                matchTerms: string[]): { [id: string]: IndexItem }|undefined {

        const result = matchTerms.map(matchTerm => {
            return getIndexItemsForSingleMatchTerm(constraintIndex, indexDefinition, matchTerm);
        }).reduce((result: any, indexItems) => {
            if (!indexItems) return result;
            Object.keys(indexItems).forEach(id => result[id] = indexItems[id]);
            return result;
        }, {});

        return Object.keys(result).length > 0 ? result : undefined;
    }


    function getIndexItemsForSingleMatchTerm(constraintIndex: ConstraintIndex,
                                             indexDefinition: IndexDefinition,
                                             matchTerm: string): { [id: string]: IndexItem }|undefined {

        return getIndex(constraintIndex, indexDefinition)[indexDefinition.path][matchTerm];
    }


    export function getIndexType(field: FieldDefinition): string {

        switch (field.inputType) {
            case 'checkboxes':
                return 'contain';
            default:
                return 'match';
        }
    }


    function getIndexDefinitions(defaultIndexDefinitions: { [name: string]: IndexDefinition },
                                 types: Array<IdaiType>): { [name: string]: IndexDefinition } {

        const definitionsFromConfiguration: Array<{ name: string, indexDefinition: IndexDefinition }> =
            getFieldsToIndex(types)
                .map((field: FieldDefinition) => makeIndexDefinitions(field))
                .reduce((result: any, definitions) => {
                    definitions.forEach(definition => result.push(definition));
                    return result;
                }, []);

        return combine(definitionsFromConfiguration, defaultIndexDefinitions);
    }


    function getFieldsToIndex(types: Array<IdaiType>): Array<FieldDefinition> {

        const fields: Array<FieldDefinition> =
            (types.reduce((result: Array<FieldDefinition>, type: IdaiType) => {
                return result.concat(type.fields);
            }, []) as any).filter((field: FieldDefinition) => field.constraintIndexed);

        return getUniqueFields(fields);
    }


    function getUniqueFields(fields: Array<FieldDefinition>): Array<FieldDefinition> {

        return fields
            .filter((field: FieldDefinition, index: number, self: Array<FieldDefinition>) => {
                return self.indexOf(
                    self.find((f: FieldDefinition) => {
                        return resultsInSameIndexDefinition(f, field);
                    }) as FieldDefinition
                ) === index;
            });
    }


    function resultsInSameIndexDefinition(field1: FieldDefinition, field2: FieldDefinition): boolean {

        return field1.name === field2.name
            && ConstraintIndex.getIndexType(field1) === ConstraintIndex.getIndexType(field2);
    }


    function makeIndexDefinitions(field: FieldDefinition)
            : Array<{ name: string, indexDefinition: IndexDefinition }> {

        return [
            makeIndexDefinition(field, getIndexType(field)),
            makeIndexDefinition(field, 'exist')
        ];
    }


    function makeIndexDefinition(field: FieldDefinition, indexType: string)
            : { name: string, indexDefinition: IndexDefinition } {

        return {
            name: field.name + ':' + indexType,
            indexDefinition: {
                path: 'resource.' + field.name,
                type: indexType
            }
        };
    }


    function combine(indexDefinitionsFromConfiguration
                               : Array<{ name: string, indexDefinition: IndexDefinition }>,
                           defaultIndexDefinitions: { [name: string]: IndexDefinition }) {

        return indexDefinitionsFromConfiguration.reduce((result: any, definition: any) => {
            result[definition.name] = definition.indexDefinition;
            return result;
        }, defaultIndexDefinitions);
    }


    function validateIndexDefinitions(indexDefinitions: Array<IndexDefinition>): string|undefined {

        const types = ['match', 'contain', 'exist'];

        for (let indexDefinition of indexDefinitions) {
            if (!indexDefinition.type) return 'Index definition type is undefined';
            if (types.indexOf(indexDefinition.type) == -1) return 'Invalid paths definition type';
        }

        return undefined;
    }


    function addToIndex(index: any, doc: Document, path: string, target: string,
                              showWarnings: boolean) {

        const indexItem = IndexItem.from(doc, showWarnings);
        if (!indexItem) return;

        if (!index[path][target]) index[path][target] = {};
        index[path][target][doc.resource.id as any] = indexItem;
    }
}