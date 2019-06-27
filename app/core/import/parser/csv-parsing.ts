import {Document} from 'idai-components-2';
import {makeLines} from './parser';

/**
 * @author Daniel de Oliveira
 */
export module CsvParsing {

    export function parse(content: string, type: string, sep: string): Array<Document> {

        // TODO get the first line, which contains the header. make sure it conforms to the specified type

        const rows = makeLines(content);
        if (rows.length < 1) return [];
        const fields = rows[0].split(sep);
        rows.shift();

        return rows.reduce((documents, row) => {

            const document = makeDocument(row.split(sep), fields);
            (document.resource as any)['type'] = type;
            return documents.concat([document as any]);

        }, [] as Array<Document>);
    }


    function implodePaths(currentSegmentObject: any, pathSegments: any[], val: any) {

        let index = parseInt(pathSegments[0]);
        if (isNaN(index)) index = pathSegments[0];

        if (pathSegments.length >= 2) {

            let nextindex = parseInt(pathSegments[1]);
            const newItem = isNaN(nextindex) ? {} : Array(nextindex + 1);

            if (!currentSegmentObject[index]) currentSegmentObject[index] = newItem;

            pathSegments.shift();
            implodePaths(currentSegmentObject[index], pathSegments, val);

        } else {

            currentSegmentObject[index] = val;
        }
    }


    function insertFieldIntoDocument(resource: any, field: any, fieldOfRow: any) {

        if (field.includes('.')) implodePaths(resource, field.split('.'), fieldOfRow);
        else (resource as any)[field] = fieldOfRow;
    }


    function makeDocument(fieldsOfRow: string[], fields: string[]) {

        return fieldsOfRow.reduce((document, fieldOfRow, i) => {

            if (fieldOfRow) insertFieldIntoDocument(document.resource, fields[i], fieldOfRow);
            return document;

        }, {resource: {}});
    }
}