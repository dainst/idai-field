import {Observable, Observer} from 'rxjs';
import {NewDocument, Document} from 'idai-components-2';
import {AbstractParser} from './abstract-parser';
import {ImportErrors} from './import-errors';

/**
 * TODO throw if id is assigned on resources
 *
 * @author Sebastian Cuy
 * @author Jan G. Wieners
 */
export class NativeJsonlParser extends AbstractParser {

    /**
     * @throws [FILE_INVALID_JSONL]
     */
    public parse(content: string): Observable<Document> {
        
        this.warnings = [];
        return Observable.create((observer: Observer<NewDocument>) => {
            NativeJsonlParser.parseContent(content, observer);
            observer.complete();
        });
    }


    private static parseContent(content: string, observer: Observer<NewDocument>) {

        const lines = content
            .replace(/\r\n|\n\r|\n|\r/g,'\n') // accept unix and windows line endings
            .split('\n');

        const len = lines.length;

        for (let i = 0; i < len; i++) {

            try {
                if (lines[i].length > 0) observer.next(NativeJsonlParser.makeDoc(lines[i]));
            } catch (e) {
                console.error('parse content error. reason: ', e);
                observer.error([ImportErrors.FILE_INVALID_JSONL, i + 1]);
                break;
            }
        }
    }


    private static makeDoc(line: string): NewDocument {

        const resource = JSON.parse(line);
        if (!resource.relations) resource.relations = {};

        return { resource: resource };
    }
}