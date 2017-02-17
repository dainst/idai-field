import {Observable} from "rxjs/Observable";
import {Document} from "idai-components-2/core";

export class ParserError extends SyntaxError {
    lineNumber: number;
    errorData: string;
}

export interface Parser {

    /**
     * Parses content to extract documents.
     * Subscription can take place safely as often as one needs it.
     * Implementations guarantee that observers are not stored permanently.
     * @param content
     */
    parse(content:string): Observable<Document>;
}