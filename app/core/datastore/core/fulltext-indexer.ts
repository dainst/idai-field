import {Document} from 'idai-components-2/core';
import {ResultSets} from './result-sets';
import {IndexItem} from './index-item';
import {ObjectUtil} from '../../../util/object-util';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class FulltextIndexer {

    private fieldsToIndex = ['identifier', 'shortDescription'];

    private index: {
        [resourceType: string]: {
            [term: string]: {
                [resourceId: string]: IndexItem
            }
        }
    };


    constructor() {

        this.setUp();
    }


    public clear() {

        this.setUp();
    }


    public put(doc: Document, skipRemoval: boolean = false) {

        const indexItem = IndexItem.from(doc);
        if (!indexItem) return;

        if (!skipRemoval) this.remove(doc);
        if (!this.index[doc.resource.type]) {
            this.index[doc.resource.type] = {'*' : { } };
        }
        this.index[doc.resource.type]['*'][doc.resource.id as any] = indexItem;

        this.fieldsToIndex.
            filter(field => doc.resource[field] && doc.resource[field] !== '').
            forEach(field =>
                doc.resource[field].split(' ').forEach((token: string) =>
                    this.indexToken(doc.resource.id as any, token,
                        doc.resource.type, indexItem)
                )
            );
    }


    private indexToken(id: string, token: string, type: string, indexItem: IndexItem) {

        Array.from(token.toLowerCase()).
            reduce((accumulator: string, letter: string) => {
                accumulator += letter;
                if (!this.index[type][accumulator]) this.index[type][accumulator] = {};
                this.index[type][accumulator][id] = indexItem;
                return accumulator;
            }, '');
    }


    public remove(doc: any) {

        Object.keys(this.index).forEach(type =>
            Object.keys(this.index[type]).
                filter(term => this.index[type][term][doc.resource.id]).
                forEach(term => delete this.index[type][term][doc.resource.id]))
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
    public get(s: string, types: string[]|undefined): Array<any> {

        if (Object.keys(this.index).length == 0) return [];

        const resultSets: ResultSets = s.split(' ').
            filter(token => token.length > 0).
            reduce((_resultSets, token) =>
                _resultSets.combine(
                    FulltextIndexer.getForToken(this.index, token, types ? types : Object.keys(this.index))),
            ResultSets.make());

        return resultSets.intersect();
    }


    private setUp() {

        this.index = { };
    }


    private static extractReplacementTokens(s: string) {

        const positionOpen = s.indexOf('[');
        const positionClose = s.indexOf(']');
        return positionOpen !== -1 && positionClose !== -1 && positionOpen < positionClose ?
            {hasPlaceholder: true, tokens: s.substr(positionOpen+1, positionClose-positionOpen-1)} :
            {hasPlaceholder: false, tokens: ''};
    }


    private static getForToken(index: any, token: string, types: string[]): Array<any> {

        return (
            types.reduce((_resultSets, type) =>
                this._get(index, _resultSets, token.toLowerCase(), type), ResultSets.make())).unify();
    }


    private static _get(index: any, resultSets: ResultSets, s: string, type: string): ResultSets {

        const {hasPlaceholder, tokens} = FulltextIndexer.extractReplacementTokens(s);
        if (hasPlaceholder) return this.getWithPlaceholder(index, resultSets, s, type, tokens);
        return this.addKeyToResultSets(index, resultSets, type, s);
    }


    private static getWithPlaceholder(index: any, resultSets: any, s: string, type: string, tokens: string): ResultSets {

        return tokens.split('').reduce((_resultSets, nextChar: string) =>
                FulltextIndexer.addKeyToResultSets(index,
                    _resultSets, type, s.replace('['+tokens+']',nextChar))
            , resultSets.copy());
    }


    private static addKeyToResultSets(index: any, resultSets: any, type: string, s: string): ResultSets {

        return (!index[type] || !index[type][s]) ?
            resultSets.copy() :
            resultSets.copy().combine(
                Object.keys(index[type][s]).map(id => ObjectUtil.cloneObject(index[type][s][id])));
    }
}