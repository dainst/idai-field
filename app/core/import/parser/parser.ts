import {Observable} from 'rxjs';
import {Document} from 'idai-components-2';


/**
 * Parses content to extract documents.
 * @param content, a msgWithParams for each problem occurred during parsing.
 */
export type Parser = (content: string) => Observable<Document>;