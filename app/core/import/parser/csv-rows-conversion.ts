import {Document} from 'idai-components-2';
import {reduce} from 'tsfun';

/**
 * @author Daniel de Oliveira
 */
export module CsvRowsConversion { // TODO make sure number typed fields get converted into number fields

    const PATH_SEP = '.';

    /**
     * @param type
     * @param sep
     * @param operationId converted into isChildOf entry if not empty
     */
    export function parse(type: string,
                          sep: string,
                          operationId: string) {

        return (rows: string[]): Array<Document> => {

            if (rows.length < 1) return [];
            const headings = rows[0].split(sep);
            rows.shift();

            return rows.reduce((documents, row) => {

                const document = makeDocument(headings)(row.split(sep));

                (document.resource as any)['type'] = type;
                if (operationId) (document.resource as any).relations = { isChildOf: operationId };

                return documents.concat([document as any]);

            }, [] as Array<Document>);
        }
    }


    function implodePaths(currentSegmentObject: any, pathSegments: any[], val: any) {

        let index = parseInt(pathSegments[0]);
        if (isNaN(index)) index = pathSegments[0];

        if (pathSegments.length < 2) {

            currentSegmentObject[index] = val;
            return;
        }

        const nextIndex = parseInt(pathSegments[1]);
        const newItem = isNaN(nextIndex) ? {} : Array(nextIndex + 1);

        if (!currentSegmentObject[index]) currentSegmentObject[index] = newItem;

        pathSegments.shift();
        implodePaths(currentSegmentObject[index], pathSegments, val);
    }


    function insertFieldIntoDocument(resource: any, field: any, fieldOfRow: any) {

        if (field.includes(PATH_SEP)) implodePaths(resource, field.split(PATH_SEP), fieldOfRow);
        else (resource as any)[field] = fieldOfRow;
    }


    function makeDocument(headings: string[]) {

        return reduce((document, fieldOfRow, i: number) => {

            if (fieldOfRow) insertFieldIntoDocument(document.resource, headings[i], fieldOfRow);
            return document;

        }, { resource: {} });
    }
}