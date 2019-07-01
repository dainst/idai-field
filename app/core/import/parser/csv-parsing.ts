import {Document} from 'idai-components-2';

/**
 * @author Daniel de Oliveira
 */
export module CsvParsing {

    export function parse(content: string): Array<Document> {

        // TODO get the first line, which contains the header. make sure it conforms to the specified type
        console.log("parser is about to parse content", content);
        return [];
    }
}