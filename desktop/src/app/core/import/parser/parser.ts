import {Document} from 'idai-field-core';


/**
 * Parses content to extract documents.
 * @param content, a msgWithParams for each problem occurred during parsing.
 */
export type Parser = (content: string) => Promise<Array<Document>>;


export function makeLines(content: string) {

    return content
        .replace(/\r\n|\n\r|\n|\r/g,'\n') // accept unix and windows line endings
        .split('\n');
}
