import {Observable} from "rxjs/Observable";
import {IdaiFieldDocument} from "../model/idai-field-document";

export interface Parser {
    parse(string): Observable<IdaiFieldDocument>;
}