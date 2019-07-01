import {Observable, Observer} from 'rxjs';
import {Document} from 'idai-components-2';
import {AbstractParser} from './abstract-parser';
import {CsvParsing} from './csv-parsing';

/**
 * @author Daniel de Oliveira
 */
export class CsvParser extends AbstractParser {

    public parse(content: string): Observable<Document> {

        return Observable.create((observer: Observer<any>) => {

            const documents = CsvParsing.parse(content);
            // documents.forEach(observer.next); TODO
            observer.complete();
        });
    }
}