import {isArray, map, flatten, flatMap, flow, cond, not, to, isDefined, singleton, Map, filter,
    subtract,
    clone} from 'tsfun';
import {Document} from '../model/document';
import {Resource} from '../model/resource';
import { Category } from '../model/category';
import { FieldDefinition } from '../model/field-definition';
import { ObjectUtils } from '../tools/object-utils';


export interface IndexDefinition {

    path: string;
    pathArray: string[];
    type: string;
    recursivelySearchable?: boolean;
}


export interface ConstraintIndex {

    indexDefinitions: { [name: string]: IndexDefinition };

    containIndex: {
        [path: string]: {
            [resourceId: string]: { [id: string]: true };
        }
    };

    matchIndex: {
        [path: string]: {
            [searchTerm: string]: { [id: string]: true };
        }
    };

    existIndex: {
        [path: string]: { [id: string]: true }
    };

    linksIndex: {
        [path: string]: {
            [resourceId: string]: { [id: string]: true }
        }
    };

    allIndex: { [resourceId: string]: true };
}



/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module ConstraintIndex {

    export function make(defaultIndexDefinitions: { [name: string]: IndexDefinition },
                         categories: Array<Category>) {

        const constraintIndex: ConstraintIndex = {
            indexDefinitions: {},
            containIndex: {},
            existIndex: {},
            matchIndex: {},
            linksIndex: {},
            allIndex: {}
        };

        constraintIndex.indexDefinitions = getIndexDefinitions(
            defaultIndexDefinitions,
            categories
        );

        const validationError = validateIndexDefinitions(Object.values(constraintIndex.indexDefinitions));
        if (validationError) throw validationError;

        setUp(constraintIndex);
        return constraintIndex;
    }


    export const clear = (index: ConstraintIndex) => setUp(index);


    export function put(index: ConstraintIndex,
                        doc: Document,
                        skipRemoval: boolean = false) {

        if (!skipRemoval) remove(index, doc);
        for (let key in index.indexDefinitions) {
            putFor(index, index.indexDefinitions[key], doc);
        }
        addToAllIndex(index.allIndex, doc);
    }


    export function remove(index: ConstraintIndex, doc: Document) {

        Object.values(index.indexDefinitions).forEach(definition => removeFromIndex(index, definition, doc));
        if (index.allIndex[doc.resource.id]) delete index.allIndex[doc.resource.id];
    }


    export function get(index: ConstraintIndex, indexName: string,
                        matchTerms: string|string[]): Array<Resource.Id> {

        const indexDefinition: IndexDefinition = index.indexDefinitions[indexName];
        if (!indexDefinition) throw 'Ignoring unknown constraint "' + indexName + '".';

        const matchedDocuments = getMatches(index, indexDefinition, matchTerms);
        if (!matchedDocuments) return [];

        return matchedDocuments;
    }


    export function getWithDescendants(index: ConstraintIndex, indexName: string,
                                       matchTerm: string|string[]): Array<Resource.Id> {

        const definition: IndexDefinition = index.indexDefinitions[indexName];
        if (!definition) throw 'Ignoring unknown constraint "' + indexName + '".';
        if (!definition.recursivelySearchable) throw 'illegal argument  - given index not recursively searchable ' + indexName;

        return flow(
            matchTerm,
            cond(not(isArray), singleton),
            map(getDescendants(index, definition)),
            flatten() as any) as any /* TODO review any*/;
    }


    export function getCount(index: ConstraintIndex, indexName: string, matchTerm: string): number {

        const indexDefinition: IndexDefinition = index.indexDefinitions[indexName];
        if (!indexDefinition) throw 'Ignoring unknown constraint "' + indexName + '".';

        const indexItems: Array<Resource.Id>|undefined
            = getMatchesForTerm(index, indexDefinition, matchTerm);

        return indexItems
            ? Object.keys(indexItems).length
            : 0;
    }


    function putFor(index: ConstraintIndex, definition: IndexDefinition, doc: Document) {

        const elForPath = getOn(definition.pathArray, doc);

        switch(definition.type) {
            case 'exist':
                if (!isMissing(elForPath)) addToExistIndex(index.existIndex, doc, definition.path);
                break;

            case 'match':
                if ((!elForPath && elForPath !== false) || Array.isArray(elForPath)) break;
                addToIndex(index.matchIndex, doc, definition.path, elForPath.toString());
                break;

            case 'contain':
                if (!elForPath || !Array.isArray(elForPath)) break;
                for (let target of elForPath) {
                    addToIndex(index.containIndex, doc, definition.path, target);
                }
                break;

            case 'links':
                if (!elForPath || !Array.isArray(elForPath)) break;
                addToLinksIndex(index.linksIndex, doc, definition.path, elForPath);
                break;
        }
    }


    function getOn(path: string[], object: any, index: number = 0) {

        if (!object) return undefined;

        return (path.length === index + 1)
            ? object[path[index]]
            : getOn(path, object[path[index]], index + 1);
    }


    function isMissing(elementForPath: any): boolean {

        return (!elementForPath && elementForPath !== false)
            || (elementForPath instanceof Array && (!elementForPath.length || elementForPath.length === 0));
    }


    function setUp(index: ConstraintIndex) {

        index.containIndex = {};
        index.matchIndex = {};
        index.existIndex = {};
        index.linksIndex = {};

        for (let indexDefinition of Object.values(index.indexDefinitions)) {
            getIndex(index, indexDefinition)[indexDefinition.path] = {};
        }
    }


    function getIndex(index: ConstraintIndex, definition: IndexDefinition): any {

        switch (definition.type) {
            case 'contain': return index.containIndex;
            case 'match':   return index.matchIndex;
            case 'exist':   return index.existIndex;
            case 'links':   return index.linksIndex;
        }
    }


    function getMatches(index: ConstraintIndex, definition: IndexDefinition,
                        matchTerms: string|string[]): Array<Resource.Id>|undefined {

        return Array.isArray(matchTerms)
            ? getMatchesForTerms(index, definition, matchTerms)
            : getMatchesForTerm(index, definition, matchTerms);
    }


    function getMatchesForTerms(index: ConstraintIndex, definition: IndexDefinition,
                                matchTerms: string[]): Array<Resource.Id>|undefined {

        const result = matchTerms.map(matchTerm => {
            return getMatchesForTerm(index, definition, matchTerm);
        }).reduce((result: any, indexItems) => {
            if (!indexItems) return result;
            return result.concat(indexItems);
        }, []);

        return Object.keys(result).length > 0 ? result : undefined;
    }


    function getMatchesForTerm(index: ConstraintIndex, definition: IndexDefinition,
                               matchTerm: string): Array<Resource.Id>|undefined {

        if (definition.type === 'exist') return getMatchesFromExistIndex(index, definition, matchTerm);

        const result = getIndex(index, definition)[definition.path][matchTerm];
        if (!result) return undefined;
        return Object.keys(result);
    }


    function getMatchesFromExistIndex(index: ConstraintIndex, definition: IndexDefinition,
                                      matchTerm: string): Array<Resource.Id> {

        const knownResourceIds: Array<Resource.Id> = Object.keys(
            getIndex(index, definition)[definition.path] ?? {}
        );

        return matchTerm === 'KNOWN'
            ? knownResourceIds
            : subtract(knownResourceIds)(Object.keys(index.allIndex));
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

        const fieldsToIndex = getFieldsToIndex(categories);

        return combine(
            flatMap(makeIndexDefinitions, fieldsToIndex),
            defaultIndexDefinitions
        );
    }


    function getFieldsToIndex(categories: Array<Category>): Array<FieldDefinition> {

        return flow(categories,
            map(Category.getFields),
            flatten(),
            getUniqueFields,
            filter<FieldDefinition>(to(FieldDefinition.CONSTRAINTINDEXED))
        );
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
     * -> ['2', '3']
     */
    function getDescendants(index: ConstraintIndex, definition: IndexDefinition) {

        return (matchTerm: string): Array<Resource.Id> => {

            const indexItems = flow(
                getMatchesForTerm(index, definition, matchTerm),
                cond(isDefined, Object.values, []));

            return indexItems
                .concat(
                    flow(
                        indexItems,
                        map(getDescendants(index, definition)),
                        flatten()));
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


    function makeIndexDefinitionForField(field: FieldDefinition,
                                         indexType: string): Array<{ name: string, indexDefinition: IndexDefinition }> {

        if (field.inputType === FieldDefinition.InputType.DROPDOWNRANGE) {
            return [
                {
                    name: field.name + '.value'+ ':' + indexType,
                    indexDefinition: {
                        path: 'resource.' + field.name + '.value',
                        pathArray: ['resource', field.name, 'value'],
                        type: indexType
                    }
                },
                {
                    name: field.name + '.endValue' + ':' + indexType,
                    indexDefinition: {
                        path: 'resource.' + field.name + '.endValue',
                        pathArray: ['resource', field.name, 'endValue'],
                        type: indexType
                    }
                }];
        }

        return [{
            name: field.name + ':' + indexType,
            indexDefinition: {
                path: 'resource.' + field.name,
                pathArray: ['resource', field.name],
                type: indexType
            }
        }];
    }


    function combine(indexDefinitionsFromConfiguration: Array<{ name: string, indexDefinition: IndexDefinition }>,
                     defaultIndexDefinitions: { [name: string]: IndexDefinition }) {

        return indexDefinitionsFromConfiguration.reduce((result: any, definition: any) => {
            result[definition.name] = definition.indexDefinition;
            return result;
        }, defaultIndexDefinitions);
    }


    function validateIndexDefinitions(indexDefinitions: Array<IndexDefinition>): string|undefined {

        const types = ['match', 'contain', 'exist', 'links'];

        for (let indexDefinition of indexDefinitions) {
            if (!indexDefinition.type) return 'Index definition type is undefined';
            if (types.indexOf(indexDefinition.type) == -1) return 'Invalid paths definition type';
            if (indexDefinition.recursivelySearchable && indexDefinition.type !== 'contain') {
                throw 'only contain indices can be configured to be recursively searchable';
            }
        }

        return undefined;
    }


    function addToIndex(index: any, doc: Document, path: string, target: string) {

        if (!index[path][target]) index[path][target] = {};
        index[path][target][doc.resource.id] = true;
    }


    function addToExistIndex(index: any, doc: Document, path: string) {

        if (!index[path]) index[path] = {};
        index[path][doc.resource.id] = true;
    }


    function addToLinksIndex(index: any, doc: Document, path: string, targets: Array<Resource.Id>) {

        const ts = {};
        for (let t of targets) ts[t] = true;
        index[path][doc.resource.id] = ts;
    }


    function addToAllIndex(index: any, doc: Document) {

        index[doc.resource.id] = true;
    }


    function removeFromIndex(index: ConstraintIndex, indexDefinition: IndexDefinition, document: Document) {

        const path = (getIndex(index, indexDefinition))[indexDefinition.path];

        if (indexDefinition.type === 'links' || indexDefinition.type === 'exist') {
            delete path[document.resource.id];
        } else {
            Object.keys(path).forEach(key => {
                delete path[key][document.resource.id];
            });
        }
    }
}
