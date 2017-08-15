import {Document} from 'idai-components-2/core';
import {ModelUtil} from '../model/model-util';
import {ResultSets} from '../util/result-sets';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class FulltextIndexer {

    private fieldsToIndex = ['identifier', 'shortDescription'];

    private index: {
        [resourceType: string]: {
            [term: string]: {
                [resourceId: string]:
                    string // date
            }
        }};

    constructor() {

        this.setUp();
    }

    public clear() {

        this.setUp();
    }

    public put(doc: Document, skipRemoval: boolean = false) {

        if (!skipRemoval) this.remove(doc);
        if (!this.index[doc.resource.type]) {
            this.index[doc.resource.type] = {'*' : { } };
        }
        const lastModified = ModelUtil.getLastModified(doc);
        this.index[doc.resource.type]['*'][doc.resource.id] = lastModified;

        for (let field of this.fieldsToIndex) {
            if (!doc.resource[field] || doc.resource[field] == '') continue;

            for (let token of doc.resource[field].split(' ')) {
                this.indexToken(doc.resource.id, token,
                    doc.resource.type, lastModified);
            }
        }
    }

    private indexToken(id: string, token: string, type: string, lastModified: string) {

        let accumulator = '';
        for (let letter of token.toLowerCase()) {
            accumulator += letter;
            if (!this.index[type][accumulator]) {
                this.index[type][accumulator] = { };
            }
            this.index[type][accumulator][id] = lastModified;
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
        return resultSets.intersect(item => item.id);
    }

    private getForToken(token: string, types: string[]): Array<any> {

        const resultSets: ResultSets = new ResultSets();

        for (let type of types) {
            this._get(resultSets, token.toLowerCase(), type);
        }

        return resultSets.unify(item => item.id);
    }

    private _get(resultSets: ResultSets, s: string, type: string) {

        if (!this.index[type] || !this.index[type][s]) return;

        resultSets.add(
            Object.keys(this.index[type][s])
                .map(id => { return { id: id, date: this.index[type][s][id] }; })
        );
    }

    private setUp() {

        this.index = { };
    }
}