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
            this.index[accumulator][doc.resource.id] = true;
        }
    }

    get(s: string)
        // TODO return them bundled with the date
        : string[]
    {
        // console.log("index",JSON.stringify(this.index));
        return Object.keys(this.index[s]);
    }
}