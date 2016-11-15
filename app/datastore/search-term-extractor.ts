import {Resource} from 'idai-components-2/core';

/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
export class SearchTermExtractor {

    public extractTerms(resource:Resource):string[] {

        var terms = [];
        for (var property in resource) {
            if (!resource.hasOwnProperty(property)) continue;
            terms = terms.concat(this.extractProperty(resource[property]));
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