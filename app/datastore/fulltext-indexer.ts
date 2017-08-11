import {ModelUtil} from "../model/model-util";
/**
 * @author Daniel de Oliveira
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

    public put(doc, skipRemoval = false) {
        if (!skipRemoval) this.remove(doc);
        if (!this.index[doc.resource.type]) {
            this.index[doc.resource.type] = {'*' : { } };
        }
        const lastModified = ModelUtil.getLastModified(doc);

        this.index[doc.resource.type]['*'][doc.resource.id] = lastModified;

        for (let field of this.fieldsToIndex) {

            if (!doc.resource[field] || doc.resource.field == '') continue;

            let accumulator = '';
            for (let letter of doc.resource[field]) {
                accumulator += letter;
                if (!this.index[doc.resource.type][accumulator]) {
                    this.index[doc.resource.type][accumulator] = { };
                }
                this.index[doc.resource.type][accumulator][doc.resource.id] = lastModified;
            }
        }
    }

    public remove(doc) {
        if (Object.keys(this.index).length == 0) return;
        for (let type of Object.keys(this.index)) {
            for (let term of Object.keys(this.index[type])) {
                if (this.index[type][term][doc.resource.id]) {
                    delete this.index[type][term][doc.resource.id];
                }
            }
        }
    }

    public get(s: string, types) {
        let resultSets = [];
        if (Object.keys(this.index).length == 0) return [];
        if (!types) types = Object.keys(this.index);

        for (let type of types) {
            this._get(resultSets, s, type);
        }
        return this.unify(resultSets);
    }

    private unify(resultSets) {
        const result = {};
        for (let resultSet of resultSets) {
            for (let item of resultSet) {
                result[item.id] = item;
            }
        }
        return Object.keys(result).map(key => result[key]);
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