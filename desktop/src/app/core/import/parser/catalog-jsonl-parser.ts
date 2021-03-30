import {NewDocument} from 'idai-field-core';
import {ParserErrors} from './parser-errors';
import {makeLines, Parser} from './parser';

/**
 * @author Sebastian Cuy
 * @author Jan G. Wieners
 * @author Daniel de Oliveira
 */
export module CatalogJsonlParser {

    /**
     * @throws [FILE_INVALID_JSONL]
     * @throws [ID_MUST_NOT_BE_SET]
     */
    export const parse: Parser = (content:string) => {

        return new Promise((resolve: Function, reject: Function) => {
            resolve(parseContent(makeLines(content), reject));
        });
    };


    function parseContent(lines: string[], reject: Function) {

        const docs: Array<NewDocument> = [];

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].length === 0) continue;

            let document: NewDocument;
            try {
                document = makeDoc(lines[i]);
            } catch (e) {
                console.error('parse content error. reason: ', e);
                reject([ParserErrors.FILE_INVALID_JSONL, i + 1]);
                break;
            }
            docs.push(document);
        }

        return docs;
    }


    function makeDoc(line: string): NewDocument {

        return JSON.parse(line);
    }
}
