import {Observable, Observer} from 'rxjs';
import {NewDocument, Document} from 'idai-components-2';
import {AbstractParser} from './abstract-parser';
import {NativeJsonlParser} from './native-jsonl-parser';
import {ParserErrors} from './parser-errors';

/**
 * @author Thomas Kleinke
 */
export class ShapefileParser extends AbstractParser {

    public parse(content: string): Observable<Document> {

        this.warnings = [];

        return Observable.create(async (observer: Observer<NewDocument>) => {
            try {
                await new NativeJsonlParser()
                    .parse(content)
                    .forEach((document: Document) => observer.next(document));
            } catch (err) {
                observer.error([ParserErrors.SHAPEFILE_GENERIC]);
            }
            observer.complete();
        });
    }
}