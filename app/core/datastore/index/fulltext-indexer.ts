import {flatMap, flow as _} from 'tsfun';
import {Document, FieldDefinition, IdaiType} from 'idai-components-2';
import {ResultSets} from './result-sets';
import {IndexItem} from './index-item';
import {clone} from '../../../core/util/object-util';


export interface FulltextIndex {

    showWarnings: boolean,

    index: {
        [resourceType: string]: {
            [term: string]: {
                [resourceId: string]: IndexItem
            }
        }
    };
}


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module FulltextIndexer {

    const defaultFieldsToIndex = ['identifier', 'shortDescription'];

    const tokenizationPattern: RegExp = /[ -]/;


    export const clear = (fulltextIndex: FulltextIndex) =>
        setUp(fulltextIndex);


    export function put(fulltextIndex: FulltextIndex,
                        document: Document,
                        typesMap: { [typeName: string]: IdaiType },
                        skipRemoval: boolean = false) {

        function indexToken(tokenAsCharArray: string[]) {

            const typeIndex = fulltextIndex.index[document.resource.type];

            tokenAsCharArray.reduce((accumulator, letter) => {
                accumulator += letter;
                if (!typeIndex[accumulator]) typeIndex[accumulator] = {};
                typeIndex[accumulator][document.resource.id as any] = indexItem as any;
                return accumulator;
            }, '');
        }


        const indexItem = IndexItem.from(document, fulltextIndex.showWarnings);
        if (!indexItem) return;

        if (!skipRemoval) remove(fulltextIndex, document);
        if (!fulltextIndex.index[document.resource.type]) fulltextIndex.index[document.resource.type] = {'*' : { } };
        fulltextIndex.index[document.resource.type]['*'][document.resource.id as any] = indexItem;

        _(getFieldsToIndex(typesMap, document.resource.type)
            .filter(field => document.resource[field])
            .filter(field => document.resource[field] !== '')
            .map(field => document.resource[field]),
            flatMap((content: string) => content.split(tokenizationPattern)))
            .map(token => token.toLowerCase())
            .map(token => Array.from(token))
            .forEach(indexToken);
    }


    export function remove(fulltextIndex: FulltextIndex, doc: any) {

        Object.keys(fulltextIndex.index).forEach(type =>
            Object.keys(fulltextIndex.index[type])
                .filter(term => fulltextIndex.index[type][term][doc.resource.id])
                .forEach(term => delete fulltextIndex.index[type][term][doc.resource.id]))
    }


    /**
     * @param s search string, which gets tokenized, so that the result will include
     *   search hits for any of the tokens. If s is "hello world", all items which are
     *   indexed under either "hello" or "world" will be included in the result. The
     *   result will be a set in the sense that it will include each item only once.
     * @param types if undefined, searches in all types. If defined, only search hits
     *   indexed under the specified types will be included in the results.
     * @returns {any} array of items
     */
    export function get(fulltextIndex: FulltextIndex,
                        s: string, types: string[]|undefined): Array<IndexItem> {

        if (Object.keys(fulltextIndex.index).length === 0) return [];

        function getFromIndex(resultSets: ResultSets, token: string) {
            ResultSets.combine(resultSets,
                getForToken(
                    fulltextIndex.index, token, types ? types : Object.keys(fulltextIndex.index)
                )
            );
            return resultSets;
        }

        return ResultSets.collapse(s
            .split(tokenizationPattern)
            .filter(token => token.length > 0)
            .reduce(getFromIndex, ResultSets.make())
            ) as Array<IndexItem>;
    }


    export function setUp(fulltextIndex: FulltextIndex) {

        fulltextIndex.index = {};
        return fulltextIndex;
    }


    function getFieldsToIndex(typesMap: { [typeName: string]: IdaiType },
                              typeName: string): string[] {

        return !typesMap[typeName]
            ? []
            : Object.values(typesMap[typeName].fields)
                .filter((field: FieldDefinition) => field.fulltextIndexed)
                .map((field: FieldDefinition) => field.name)
                .concat(defaultFieldsToIndex);
    }


    function extractReplacementTokens(s: string) {

        const positionOpen = s.indexOf('[');
        const positionClose = s.indexOf(']');
        return positionOpen !== -1 && positionClose !== -1 && positionOpen < positionClose ?
            {hasPlaceholder: true, tokens: s.substr(positionOpen+1, positionClose-positionOpen-1)} :
            {hasPlaceholder: false, tokens: ''};
    }


    function getForToken(index: any, token: string, types: string[]): Array<any> {

        const s = token.toLowerCase();

        function get(resultSets: ResultSets, type: string): ResultSets {

            const {hasPlaceholder, tokens} = extractReplacementTokens(s);
            return hasPlaceholder
                ? getWithPlaceholder(index, resultSets, s, type, tokens)
                : addKeyToResultSets(index, resultSets, type, s);
        }

        return ResultSets.unify(types.reduce(get, ResultSets.make()));
    }


    function getWithPlaceholder(index: any, resultSets: ResultSets,
                                s: string, type: string, tokens: string): ResultSets {

        return tokens.split('').reduce((_resultSets, nextChar: string) =>
                addKeyToResultSets(
                    index, _resultSets, type, s.replace('[' + tokens + ']', nextChar)
                )
            , resultSets);
    }


    function addKeyToResultSets(index: any, resultSets: ResultSets,
                                      type: string, s: string): ResultSets {

        if (!index[type] || !index[type][s]) return resultSets;

        ResultSets.combine(resultSets, Object.keys(index[type][s]).map(id => clone(index[type][s][id])));
        return resultSets;
    }
}