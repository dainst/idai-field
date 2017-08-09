import {ModelUtil} from "../model/model-util";
/**
 * @author Daniel de Oliveira
 */
export class FulltextIndexer {

    private index = {};

    add(doc) {
        let accumulator = '';
        for (let letter of doc.resource.identifier) {
            accumulator += letter;
            if (!this.index[accumulator]) this.index[accumulator] = {};
            this.index[accumulator][doc.resource.id] = ModelUtil.getLastModified(doc);
        }
    }

    get(s: string) {
        // console.log("index",JSON.stringify(this.index));
        return Object.keys(this.index[s])
            .map(id => {return {id: id, date: this.index[s][id]}});
    }
}