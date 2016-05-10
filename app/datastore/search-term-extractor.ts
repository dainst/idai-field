import {IdaiFieldObject} from "../model/idai-field-object";

/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
export class SearchTermExtractor {

    public extractTerms(object:IdaiFieldObject):string[] {

        var terms = [];
        for (var property in object) {
            if (!object.hasOwnProperty(property)) continue;
            terms = terms.concat(this.extractProperty(object[property]));
        }
        return terms.map( term => term.toLowerCase());
    }

    private extractProperty(prop) : string[] {
        var terms = [];
        if (this.isNonEmptyString(prop)) {
            terms = terms.concat(this.tokenize(prop));
        }
        else if ( prop.constructor === Array ) {
            terms = terms.concat(this.dissectArray(prop));
        }
        return terms;
    }

    private dissectArray(any) {
        var terms = [];
        for (var item of any) {
            if (this.isNonEmptyString(item)) {
                terms = terms.concat(this.tokenize(item));
            }
        }
        return terms;
    }

    private isNonEmptyString(any) {
        return (typeof any == "string" && any.length > 0);
    }

    private tokenize(string:string):string[] {
        return string.match(/\w+/g);
    }
}