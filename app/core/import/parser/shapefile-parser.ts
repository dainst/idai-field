import {Observable, Observer} from 'rxjs';
import {NewDocument, Document} from 'idai-components-2';
import {NativeJsonlParser} from './native-jsonl-parser';
import {ParserErrors} from './parser-errors';
import {Parser} from './parser';

/**
 * @author Thomas Kleinke
 */
export module ShapefileParser {

    export const parse: Parser = (content: string) => {

        return Observable.create(async (observer: Observer<NewDocument>) => {
            try {
                await NativeJsonlParser
                    .parse(content)
                    .forEach((document: Document) => observer.next(document));
            } catch (err) {
                observer.error([ParserErrors.SHAPEFILE_GENERIC]);
            }
            observer.complete();
        });
    }
}