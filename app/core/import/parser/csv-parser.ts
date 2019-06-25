import {Observable, Observer} from 'rxjs';
import {CsvParsing} from './csv-parsing';
import {Parser} from './parser';

/**
 * @author Daniel de Oliveira
 */
export module CsvParser {

    export const parse: Parser = (content: string) => {

        return Observable.create((observer: Observer<any>) => {

            const documents = CsvParsing.parse(content);
            // documents.forEach(observer.next); TODO
            observer.complete();
        });
    }
}