import {Document} from 'idai-components-2';

/**
 * @author Daniel de Oliveira
 */
export module CsvParsing {

    export function parse(content: string, type: string): Array<Document> {

        // TODO get the first line, which contains the header. make sure it conforms to the specified type

        const rows = content.split('\n');
        if (rows.length < 1) return [];
        const fields = rows[0].split(',');
        rows.shift();

        return rows.reduce((documents, row) => {

            const rowContents = row.split(',');
            const document = makeDocument(rowContents, fields);
            (document.resource as any)['type'] = type;
            return documents.concat([document as any]);

        }, [] as Array<Document>);
    }


    function makeDocument(rowContents: string[], fields: string[]) {

        return rowContents.reduce((document, rowField, i) => {

            if (rowField) {
                (document.resource as any)[fields[i]] = rowField;
            }
            return document;

        }, {resource: {}});
    }
}