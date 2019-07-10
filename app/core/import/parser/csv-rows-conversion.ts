import {Resource} from 'idai-components-2';
import {reduce, flatReduce} from 'tsfun';

/**
 * @author Daniel de Oliveira
 */
export module CsvRowsConversion {

    const PATH_SEP = '.';

    /**
     * @param sep
     */
    export function parse(sep: string) {

        return (rows: string[]): Array<Resource> => {

            if (rows.length < 1) return [];
            const headings = rows[0].split(sep);
            rows.shift();

            return flatReduce((row: string) => makeResource(headings)(row.split(sep)))(rows);
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


    function makeResource(headings: string[]) {

        return reduce((resource, fieldOfRow, i: number) => {

            if (fieldOfRow) insertFieldIntoDocument(resource, headings[i], fieldOfRow);
            return resource as unknown as Resource;

        }, {} as Resource);
    }
}