import {Observable, Observer} from 'rxjs';
import {NewDocument, Document} from 'idai-components-2';
import {AbstractParser} from './abstract-parser';
import {ParserErrors} from './parser-errors';

/**
 * @author Sebastian Cuy
 * @author Jan G. Wieners
 */
export class NativeJsonlParser extends AbstractParser {

    /**
     * @throws [FILE_INVALID_JSONL]
     * @throws [ID_MUST_NOT_BE_SET]
     */
    public parse(content: string): Observable<Document> {

        this.warnings = [];
        return Observable.create((observer: Observer<NewDocument>) => {
            NativeJsonlParser.parseContent(NativeJsonlParser.makeLines(content), observer);
            observer.complete();
        });
    }


    private static parseContent(lines: string[], observer: Observer<NewDocument>) {

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].length === 0) continue;

            let document: NewDocument;
            try {
                document = NativeJsonlParser.makeDoc(lines[i]);
            } catch (e) {
                console.error('parse content error. reason: ', e);
                observer.error([ParserErrors.FILE_INVALID_JSONL, i + 1]);
                break;
            }
            NativeJsonlParser.assertIsValid(document);
            observer.next(document);
        }
    }


    private static makeLines(content: string) {

        return content
            .replace(/\r\n|\n\r|\n|\r/g,'\n') // accept unix and windows line endings
            .split('\n');
    }


    private static assertIsValid(document: NewDocument) {

        if (document.resource.id) throw [ParserErrors.ID_MUST_NOT_BE_SET];
    }


    private static makeDoc(line: string): NewDocument {

        const resource = JSON.parse(line);
        if (!resource.relations) resource.relations = {};

        return { resource: resource };
    }
}