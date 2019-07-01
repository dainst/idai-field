import {Observable} from 'rxjs';
import {Document} from 'idai-components-2';
import {Parser} from './parser';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export abstract class AbstractParser implements Parser {



    abstract parse(content: string): Observable<Document>;
}