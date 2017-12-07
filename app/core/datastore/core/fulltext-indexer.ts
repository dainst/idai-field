import {Action, Document} from 'idai-components-2/core';
import {ChangeHistoryUtil} from '../../model/change-history-util';
import {ResultSets} from '../../../util/result-sets';
import {IndexItem} from './index-item';

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

        if (Object.keys(this.index).length == 0) return;
        for (let type of Object.keys(this.index)) {
            for (let term of Object.keys(this.index[type])) {
                if (this.index[type][term][doc.resource.id]) {
                    delete this.index[type][term][doc.resource.id];
                }
            }
        }
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
    public get(s: string, types: string[]): Array<any> {

        if (Object.keys(this.index).length == 0) return [];

        const resultSets: ResultSets = s.split(' ').
            filter(token => token.length > 0).
            reduce((_resultSets, token) =>
                ResultSets.add(_resultSets,
                    this.getForToken(token, types ? types : Object.keys(this.index))),
            ResultSets.make());

        return ResultSets.intersect(resultSets, (item: any) => item.id);
    }


    private getForToken(token: string, types: string[]): Array<any> {

        const resultSets: ResultSets = types.reduce((_resultSets, type) =>
            this._get(_resultSets, token.toLowerCase(), type), ResultSets.make());

        return ResultSets.unify(resultSets, (item: any) => item.id);
    }


    private _get(resultSets: ResultSets, s: string, type: string): ResultSets {

        const {hasPlaceholder, tokens} = FulltextIndexer.extractReplacementTokens(s);
        if (hasPlaceholder) {
            return this.getWithPlaceholder(resultSets, s, type, tokens);
        }

        return this.addKeyToResultSets(resultSets, type, s);
    }


    private getWithPlaceholder(resultSets: any, s: string, type: string, tokens: string): ResultSets {

        let results = ResultSets.copy(resultSets);
        for(let i=0; i<tokens.length; i++) {

            let nextChar = tokens.charAt(i);
            const replaced = s.replace('['+tokens+']',nextChar);

            results = this.addKeyToResultSets(results, type, replaced);
        }
        return results;
    }


    private addKeyToResultSets(resultSets: any, type: string, s: string): ResultSets {

        if (!this.index[type] || !this.index[type][s]) return ResultSets.copy(resultSets);

        return ResultSets.add(ResultSets.copy(resultSets),
            Object.keys(this.index[type][s]).map(id => {
                const indexItem: IndexItem = {
                    date: this.index[type][s][id].date,
                    identifier: this.index[type][s][id].identifier
                };
                (indexItem as any)['id'] = id;
                return indexItem;
            })
        );
    }


    private setUp() {

        this.index = { };
    }


    private static extractReplacementTokens(s: string) {

        const positionOpen = s.indexOf('[');
        const positionClose = s.indexOf(']');
        if (positionOpen !== -1 && positionClose !== -1 && positionOpen < positionClose) {
            const str = s.substr(positionOpen+1, positionClose-positionOpen-1);
            return {hasPlaceholder: true, tokens: str};
        } else {
            return {hasPlaceholder: false, tokens: ''};
        }
    }
}