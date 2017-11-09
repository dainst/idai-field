import {Document, Action} from 'idai-components-2/core';
import {ChangeHistoryUtil} from '../../model/change-history-util';
import {ResultSets} from '../../../util/result-sets';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class FulltextIndexer {


    private fieldsToIndex = ['identifier', 'shortDescription'];

    private index: {
        [resourceType: string]: {
            [term: string]: {
                [resourceId: string]: {
                    date: Date,
                    identifier: string
                }
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

        const lastModified: Action = ChangeHistoryUtil.getLastModified(doc);
        if (!lastModified) {
            console.warn('FulltextIndexer: Failed to index document. ' +
                'The document does not contain a created/modified action.', doc);
            return;
        }

        if (!skipRemoval) this.remove(doc);
        if (!this.index[doc.resource.type]) {
            this.index[doc.resource.type] = {'*' : { } };
        }
        this.index[doc.resource.type]['*'][doc.resource.id as any] = {
            date: ChangeHistoryUtil.getLastModified(doc).date,
            identifier: doc.resource['identifier']
        } as any;

        for (let field of this.fieldsToIndex) {
            if (!doc.resource[field] || doc.resource[field] == '') continue;

            for (let token of doc.resource[field].split(' ')) {
                this.indexToken(doc.resource.id as any, token,
                    doc.resource.type, doc);
            }
        }
    }


    private indexToken(id: string, token: string, type: string, doc: Document) {

        let accumulator = '';
        for (let letter of token.toLowerCase()) {
            accumulator += letter;
            if (!this.index[type][accumulator]) {
                this.index[type][accumulator] = { };
            }
            this.index[type][accumulator][id] = {
                date: ChangeHistoryUtil.getLastModified(doc).date,
                identifier: doc.resource['identifier']
            } as any;
        }
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

        const resultSets: ResultSets = new ResultSets();
        for (let token of s.split(' ')) {
            if (token.length > 0) {
                resultSets.add(
                    this.getForToken(token, types ? types : Object.keys(this.index))
                )
            }
        }
        return resultSets.intersect((item: any) => item.id);
    }


    private getForToken(token: string, types: string[]): Array<any> {

        const resultSets: ResultSets = new ResultSets();

        for (let type of types) {
            this._get(resultSets, token.toLowerCase(), type);
        }

        return resultSets.unify((item: any) => item.id);
    }


    private _get(resultSets: ResultSets, s: string, type: string) {

        const {hasPlaceholder, tokens} = FulltextIndexer.extractReplacementTokens(s);
        if (hasPlaceholder) {
            return this.getWithPlaceholder(resultSets, s, type, tokens);
        }

        this.addKeyToResultSets(resultSets, type, s);
    }


    private getWithPlaceholder(resultSets: any, s: string, type: string, tokens: string) {

        for(let i=0; i<tokens.length; i++)
        {
            let nextChar = tokens.charAt(i);
            const replaced = s.replace('['+tokens+']',nextChar);

            this.addKeyToResultSets(resultSets, type, replaced);
        }
    }


    private addKeyToResultSets(resultSets: any, type: string, s: string) {

        if (!this.index[type] || !this.index[type][s]) return;

        resultSets.add(
            Object.keys(this.index[type][s]).map(id => {
                return { id: id,
                    date: this.index[type][s][id].date,
                    identifier: this.index[type][s][id].identifier
                };
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