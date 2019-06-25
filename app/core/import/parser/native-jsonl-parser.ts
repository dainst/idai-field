import {Observable, Observer} from 'rxjs';
import {NewDocument} from 'idai-components-2';
import {ParserErrors} from './parser-errors';
import {Parser} from './parser';

/**
 * @author Sebastian Cuy
 * @author Jan G. Wieners
 */
export module NativeJsonlParser {

    /**
     * @throws [FILE_INVALID_JSONL]
     * @throws [ID_MUST_NOT_BE_SET]
     */
    export const parse: Parser = (content:string) => {

        return Observable.create((observer: Observer<NewDocument>) => {
            parseContent(makeLines(content), observer);
            observer.complete();
        });
    };


    function parseContent(lines: string[], observer: Observer<NewDocument>) {

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].length === 0) continue;

            let document: NewDocument;
            try {
                document = makeDoc(lines[i]);
            } catch (e) {
                console.error('parse content error. reason: ', e);
                observer.error([ParserErrors.FILE_INVALID_JSONL, i + 1]);
                break;
            }
            assertIsValid(document);
            observer.next(document);
        }
    }


    function makeLines(content: string) {

        return content
            .replace(/\r\n|\n\r|\n|\r/g,'\n') // accept unix and windows line endings
            .split('\n');
    }


    function assertIsValid(document: NewDocument) {

        if (document.resource.id) throw [ParserErrors.ID_MUST_NOT_BE_SET];
    }


    function makeDoc(line: string): NewDocument {

        const resource = JSON.parse(line);
        if (!resource.relations) resource.relations = {};

        return { resource: resource };
    }
}