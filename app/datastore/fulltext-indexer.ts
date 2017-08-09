import {ModelUtil} from "../model/model-util";
/**
 * @author Daniel de Oliveira
 */
export class FulltextIndexer {

    private index;

    constructor() {
        this.setUp();
    }

    public clear() {
        this.setUp();
    }

    public add(doc) {
        if (!this.index[doc.resource.type]) this.index[doc.resource.type] = { };

        let accumulator = '';
        for (let letter of doc.resource.identifier) {
            accumulator += letter;
            if (!this.index[doc.resource.type][accumulator]) {
                this.index[doc.resource.type][accumulator] = {};
            }
            this.index[doc.resource.type][accumulator][doc.resource.id]
                = ModelUtil.getLastModified(doc);
        }
    }

    public get(s: string, types) {
        let resultSets = [];
        if (Object.keys(this.index).length == 0) return [];
        if (!types) types = Object.keys(this.index);

        for (let type of types) {
            this._get(resultSets, s, type);
        }
        return resultSets;
    }

    private _get(resultSets, s, type) {
        if (!this.index[type]) return resultSets.push([]);
        if (!this.index[type][s]) return resultSets.push([]);

        resultSets.push(Object.keys(this.index[type][s])
            .map(id => {return {id: id, date: this.index[type][s][id]}}));
    }

    private setUp() {
        this.index = { };
    }
}