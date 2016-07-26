import {Observable} from "rxjs/Observable";
import {IdaiFieldDocument} from "../model/idai-field-document";

export class ParserError extends SyntaxError {
    lineNumber: number;
    errorData: string;
}

export interface Parser {
    parse(string): Observable<IdaiFieldDocument>;
}