import {values, isArray, map, flatten, flatMap, flow, cond, not, to, isDefined, singleton, Map, filter} from 'tsfun';
import {getOn} from 'tsfun/struct';
import {Document, Resource} from 'idai-components-2';
import {IndexItem} from './index-item';
import {Category} from '../../configuration/model/category';
import {FieldDefinition} from '../../configuration/model/field-definition';
import {clone} from '../../util/object-util';
import {Named} from '../../util/named';


export interface IndexDefinition {

    path: string;
    type: string;
    recursivelySearchable?: boolean;
}


export interface ConstraintIndex {

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
                         categoriesMap: { [categoryName: string]: Category }) {

        const constraintIndex: ConstraintIndex = {
            indexDefinitions: {}, containIndex: {}, existIndex: {}, matchIndex: {}
        };

        constraintIndex.indexDefinitions = getIndexDefinitions(
            defaultIndexDefinitions,
            Object.values(categoriesMap)
        );

        const validationError = validateIndexDefinitions(Object.values(constraintIndex.indexDefinitions));
        if (validationError) throw validationError;

        setUp(constraintIndex);
        return constraintIndex;
    }


    export const clear = (index: ConstraintIndex) => setUp(index);


    export function put(index: ConstraintIndex,
                        doc: Document,
                        indexItem: IndexItem,
                        skipRemoval: boolean = false) {

        if (!skipRemoval) remove(index, doc);
        for (let indexDefinition of values(index.indexDefinitions)) {
            putFor(index, indexDefinition, doc, indexItem);
        }
    }


    export function remove(index: ConstraintIndex, doc: Document) {

        Object.values(index.indexDefinitions)
            .map(definition => (getIndex(index, definition))[definition.path])
            .forEach(path =>
                Object.keys(path)
                    .filter(key => path[key][doc.resource.id])
                    .forEach(key => delete path[key][doc.resource.id])
            );
    }


    export function get(index: ConstraintIndex, indexName: string,
                        matchTerms: string|string[]): Array<IndexItem> {

        const indexDefinition: IndexDefinition = index.indexDefinitions[indexName];
        if (!indexDefinition) throw 'Ignoring unknown constraint "' + indexName + '".';

        const matchedDocuments = getIndexItems(index, indexDefinition, matchTerms);
        if (!matchedDocuments) return [];

        return Object.keys(matchedDocuments).map(id => ({
            id: id,
            identifier: matchedDocuments[id].identifier
        }));
    }


    export function getWithDescendants(index: ConstraintIndex, indexName: string,
                                       matchTerm: string|string[]): Array<IndexItem> {

        const definition: IndexDefinition = index.indexDefinitions[indexName];
        if (!definition) throw 'Ignoring unknown constraint "' + indexName + '".';
        if (!definition.recursivelySearchable) throw 'illegal argument  - given index not recursively searchable ' + indexName;

        return flow(
            matchTerm,
            cond(not(isArray), singleton),
            map(getDescendants(index, definition)),
            flatten);
    }


    export function getCount(index: ConstraintIndex, indexName: string,
                             matchTerm: string): number {

        const indexDefinition: IndexDefinition = index.indexDefinitions[indexName];
        if (!indexDefinition) throw 'Ignoring unknown constraint "' + indexName + '".';

        const indexItems: Map<IndexItem>|undefined
            = getIndexItemsForSingleMatchTerm(index, indexDefinition, matchTerm);

        return indexItems
            ? Object.keys(indexItems).length
            : 0;
    }


    function putFor(index: ConstraintIndex,
                    definition: IndexDefinition,
                    doc: Document,
                    item: IndexItem) {

        const elForPath = getOn(definition.path, undefined)(doc);

        switch(definition.type) {
            case 'exist':
                addToIndex(
                    index.existIndex,
                    doc,
                    definition.path,
                    isMissing(elForPath) ? 'UNKNOWN' : 'KNOWN',
                    item);
                break;

            case 'match':
                if ((!elForPath && elForPath !== false) || Array.isArray(elForPath)) break;
                addToIndex(index.matchIndex, doc, definition.path, elForPath.toString(),
                    item);
                break;

            case 'contain':
                if (!elForPath || !Array.isArray(elForPath)) break;
                for (let target of elForPath) {
                    addToIndex(index.containIndex,
                        doc, definition.path, target, item);
                }
                break;
        }
    }


    function isMissing(elementForPath: any): boolean {

        return (!elementForPath && elementForPath !== false)
            || (elementForPath instanceof Array && (!elementForPath.length || elementForPath.length === 0));
    }


    function setUp(index: ConstraintIndex) {

        index.containIndex = {};
        index.matchIndex = {};
        index.existIndex = {};

        for (let indexDefinition of Object.values(index.indexDefinitions)) {
            getIndex(index, indexDefinition)[indexDefinition.path] = {};
        }
    }


    function getIndex(index: ConstraintIndex,
                      definition: IndexDefinition): any {

        switch (definition.type) {
            case 'contain': return index.containIndex;
            case 'match':   return index.matchIndex;
            case 'exist':   return index.existIndex;
        }
    }


    function getIndexItems(index: ConstraintIndex, definition: IndexDefinition,
                           matchTerms: string|string[]): { [id: string]: IndexItem }|undefined {

        return Array.isArray(matchTerms)
            ? getIndexItemsForMultipleMatchTerms(index, definition, matchTerms)
            : getIndexItemsForSingleMatchTerm(index, definition, matchTerms);
    }


    function getIndexItemsForMultipleMatchTerms(index: ConstraintIndex,
                                                definition: IndexDefinition,
                                                matchTerms: string[]): { [id: string]: IndexItem }|undefined {

        const result = matchTerms.map(matchTerm => {
            return getIndexItemsForSingleMatchTerm(index, definition, matchTerm);
        }).reduce((result: any, indexItems) => {
            if (!indexItems) return result;
            Object.keys(indexItems).forEach(id => result[id] = indexItems[id]);
            return result;
        }, {});

        return Object.keys(result).length > 0 ? result : undefined;
    }


    function getIndexItemsForSingleMatchTerm(index: ConstraintIndex,
                                             definition: IndexDefinition,
                                             matchTerm: string): { [id: string]: IndexItem }|undefined {

        return getIndex(index, definition)[definition.path][matchTerm];
    }


    export function getIndexType(field: FieldDefinition): string {

        switch (field.inputType) {
            case 'checkboxes':
            case 'multiInput':
                return 'contain';
            default:
                return 'match';
        }
    }


    function getIndexDefinitions(defaultIndexDefinitions: Map<IndexDefinition>,
                                 categories: Array<Category>): Map<IndexDefinition> {

        return combine(
            flatMap(makeIndexDefinitions)(getFieldsToIndex(categories)),
            defaultIndexDefinitions);
    }


    function getFieldsToIndex(categories: Array<Category>): Array<FieldDefinition> {

        return flow(
                categories,
                map(Category.getFields),
                flatten,
                getUniqueFields,
                filter(to(FieldDefinition.CONSTRAINTINDEXED)));
    }


    function getUniqueFields(fields: Array<FieldDefinition>): Array<FieldDefinition> {

        return clone(
            fields.filter((field: FieldDefinition, index: number, self: Array<FieldDefinition>) => {
                return self.indexOf(
                    self.find((f: FieldDefinition) => {
                        return resultsInSameIndexDefinition(f, field);
                    }) as FieldDefinition
                ) === index;
            })
        );
    }


    /**
     * '1'
     *  - '2'
     *    - '3'
     *
     * matchTerm: '1'
     * -> [{id: '2'}, {id: '3'}]
     */
    function getDescendants(index: ConstraintIndex,
                            definition: IndexDefinition) {

        return (matchTerm: string): Array<IndexItem> => {

            const indexItems = flow(
                getIndexItemsForSingleMatchTerm(index, definition, matchTerm),
                cond(isDefined, values, []));

            return indexItems
                .concat(
                    flow(
                        indexItems,
                        map(to(Resource.ID)),
                        map(getDescendants(index, definition)),
                        flatten));
        }
    }


    function resultsInSameIndexDefinition(field1: FieldDefinition, field2: FieldDefinition): boolean {

        return field1.name === field2.name
            && field1.constraintIndexed === field2.constraintIndexed
            && ConstraintIndex.getIndexType(field1) === ConstraintIndex.getIndexType(field2);
    }


    function makeIndexDefinitions(field: FieldDefinition)
            : Array<{ name: string, indexDefinition: IndexDefinition }> {

        return flatten([
            makeIndexDefinitionForField(field, getIndexType(field)),
            makeIndexDefinitionForField(field, 'exist')
        ]);
    }


    function makeIndexDefinitionForField(field: FieldDefinition, indexType: string)
            : Array<{ name: string, indexDefinition: IndexDefinition }> {

        if (field.inputType === FieldDefinition.InputType.DROPDOWNRANGE) {
            return [
                {
                    name: field.name + '.value'+ ':' + indexType,
                    indexDefinition: {
                        path: 'resource.' + field.name + '.value',
                        type: indexType
                    }
                },
                {
                    name: field.name + '.endValue' + ':' + indexType,
                    indexDefinition: {
                        path: 'resource.' + field.name + '.endValue',
                        type: indexType
                    }
                }];
        }

        return [{
            name: field.name + ':' + indexType,
            indexDefinition: {
                path: 'resource.' + field.name,
                type: indexType
            }
        }];
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
            if (indexDefinition.recursivelySearchable && indexDefinition.type !== 'contain') {
                throw 'only contain indices can be configured to be recursively searchable';
            }
        }

        return undefined;
    }


    function addToIndex(index: any,
                        doc: Document, path: string, target: string,
                        item: IndexItem) {

        if (!index[path][target]) index[path][target] = {};
        index[path][target][doc.resource.id] = item;
    }
}