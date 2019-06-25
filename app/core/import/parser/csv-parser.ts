import {Observable, Observer} from 'rxjs';
import {CsvParsing} from './csv-parsing';
import {Parser} from './parser';
import {Document} from 'idai-components-2';

/**
 * @author Daniel de Oliveira
 */
export module CsvParser {

    export const parse: Parser = (content: string) => {

        return new Promise<Array<Document>>((resolve: Function) => {

            const documents = CsvParsing.parse(content);
            // documents.forEach(observer.next); TODO
            resolve(documents);
        });
    }
}