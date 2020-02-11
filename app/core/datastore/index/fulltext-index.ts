import {flatMap, flow, lookup, filter, map, forEach, empty, isNot, isEmpty, keys} from 'tsfun';
import {Document} from 'idai-components-2';
import {ResultSets} from './result-sets';
import {clone} from '../../util/object-util';
import {IdaiType} from '../../configuration/model/idai-type';
import {split, toArray, toLowerCase} from '../../util/utils';
import {IndexItem} from './index-item';


export interface FulltextIndex {
    [resourceType: string]: {
        [term: string]: {
            [resourceId: string]: IndexItem
        }
    }
}


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module FulltextIndex {

    const defaultFieldsToIndex = ['identifier', 'shortDescription'];

    const tokenizationPattern: RegExp = /[ -]/;


    export const clear = (index: FulltextIndex) => setUp(index);


    export function put(index: FulltextIndex,
                        document: Document,
                        indexItem: IndexItem,
                        typesMap: { [typeName: string]: IdaiType },
                        skipRemoval: boolean = false) {

        if (!skipRemoval) remove(index, document);
        if (!index[document.resource.type]) {
            index[document.resource.type] = {'*' : { } };
        }
        index[document.resource.type]['*'][document.resource.id] = indexItem;

        flow(
            getFieldsToIndex(typesMap, document.resource.type),
            filter(lookup(document.resource)),
            filter((field: any) => document.resource[field] !== ''),
            map(lookup(document.resource)),
            flatMap(split(tokenizationPattern)),
            map(toLowerCase),
            map(toArray),
            forEach(indexToken(index, document, indexItem)));
    }


    export function remove(index: FulltextIndex, doc: any) {

        Object.keys(index).forEach(type =>
            Object.keys(index[type])
                .filter(term => index[type][term][doc.resource.id])
                .forEach(term => delete index[type][term][doc.resource.id]))
    }


    /**
     * @param index
     * @param s search string, which gets tokenized, so that the result will include
     *   search hits for any of the tokens. If s is "hello world", all items which are
     *   indexed under either "hello" or "world" will be included in the result. The
     *   result will be a set in the sense that it will include each item only once.
     * @param types if undefined, searches in all types. If defined, only search hits
     *   indexed under the specified types will be included in the results.
     */
    export function get(index: FulltextIndex,
                        s: string,
                        types: string[]|undefined): Array<IndexItem> {

        if (isEmpty(index)) return [];

        const resultSets = s
            .split(tokenizationPattern)
            .filter(isNot(empty))
            .reduce(getFromIndex(index, types), ResultSets.make());

        return ResultSets.collapse(resultSets) as Array<IndexItem>;
    }


    export function setUp(index: FulltextIndex) {

        index = {};
        return index;
    }


    function getFromIndex(index: FulltextIndex, types: string[]|undefined) {

        return (resultSets: ResultSets, token: string) => {

            ResultSets.combine(resultSets,
                getForToken(
                    index,
                    token,
                    types
                        ? types
                        : keys(index)
                )
            );
            return resultSets;
        }
    }


    function indexToken(index: FulltextIndex, document: Document, indexItem: IndexItem) {

        return (tokenAsCharArray: string[]) => {

            const typeIndex = index[document.resource.type];

            tokenAsCharArray.reduce((accumulator, letter) => {
                accumulator += letter;
                if (!typeIndex[accumulator]) typeIndex[accumulator] = {};
                typeIndex[accumulator][document.resource.id] = indexItem;
                return accumulator;
            }, '');
        }
    }


    function getFieldsToIndex(typesMap: { [typeName: string]: IdaiType },
                              typeName: string): string[] {

        return !typesMap[typeName]
            ? []
            : Object.values(typesMap[typeName].fields)
                .filter(field => field.fulltextIndexed)
                .map(field => field.name)
                .concat(defaultFieldsToIndex);
    }


    function extractReplacementTokens(s: string) {

        const positionOpen = s.indexOf('[');
        const positionClose = s.indexOf(']');
        return positionOpen !== -1 && positionClose !== -1 && positionOpen < positionClose ?
            { hasPlaceholder: true, tokens: s.substr(positionOpen+1, positionClose-positionOpen-1)} :
            { hasPlaceholder: false, tokens: ''};
    }


    function getForToken(index: FulltextIndex, token: string, types: string[]): Array<any> {

        const s = token.toLowerCase();

        function get(resultSets: ResultSets, type: string): ResultSets {

            const {hasPlaceholder, tokens} = extractReplacementTokens(s);
            return hasPlaceholder
                ? getWithPlaceholder(index, resultSets, s, type, tokens)
                : addKeyToResultSets(index, resultSets, type, s);
        }

        return ResultSets.unify(types.reduce(get, ResultSets.make()));
    }


    function getWithPlaceholder(index: FulltextIndex, resultSets: ResultSets,
                                s: string, type: string, tokens: string): ResultSets {

        return tokens.split('').reduce((_resultSets, nextChar: string) =>
                addKeyToResultSets(
                    index, _resultSets, type, s.replace('[' + tokens + ']', nextChar)
                )
            , resultSets);
    }


    function addKeyToResultSets(index: FulltextIndex, resultSets: ResultSets,
                                type: string, s: string): ResultSets {

        if (!index[type] || !index[type][s]) return resultSets;

        ResultSets.combine(resultSets, keys(index[type][s]).map(id => clone(index[type][s][id])));
        return resultSets;
    }
}