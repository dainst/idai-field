import {Observable, Observer} from 'rxjs';
import {Document} from 'idai-components-2';
import {AbstractParser} from './abstract-parser';
import {ParserErrors} from './parser-errors';
import {Geojson} from './geojson-parser';
// import * as Papa from 'papaparse'; this does not work in production, fixes only unit test

/**
 * @author Daniel de Oliveira
 */
export class CsvParser extends AbstractParser {

    public parse(content: string): Observable<Document> {

        return Observable.create((observer: Observer<any>) => {

            console.log("parser is about to parse content", content);

            // TODO get the first line, which contains the header. make sure it conforms to the specified type

            observer.complete();
        });
    }
}