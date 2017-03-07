import {Observable} from "rxjs/Observable";
import {Document} from "idai-components-2/core";

export interface Parser {

    /**
     * Parses content to extract documents.
     * @param content, a msgWithParams for each problem occured during parsing.
     */
    parse(content:string): Observable<Document>;
}