import {AbstractParser} from './abstract-parser';
import {Observable} from 'rxjs/Observable';
import {Document} from 'idai-components-2/core';
import {Observer} from 'rxjs/Observer';

/**
 * @author Daniel de Oliveira
 */
export class MeninxCsvParser extends AbstractParser {

    public parse(content: string): Observable<Document> {

        return Observable.create((observer: Observer<Document>) => {
            observer.complete();
        });
    }
}