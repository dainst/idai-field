import {reduce, flatReduce, ObjectStruct, arrayList} from 'tsfun';

/**
 * @author Daniel de Oliveira
 */
export module CsvRowsConversion {

    const PATH_SEP = '.';


    /**
     * @param sep
     */
    export function parse(sep: string) { return (rows: string[]): Array<ObjectStruct> => {

        if (rows.length < 1) return [];
        const headings = rows[0].split(sep); // TODO maybe split outside, or also do the splitting of arrays by ; here
        rows.shift();

        return flatReduce((row: string) => makeObjectStruct(headings)(row.split(sep)))(rows);
    }}


    function implodePaths(currentSegmentObject: any, pathSegments: any[], val: any) {

        let index = parseInt(pathSegments[0]);
        if (isNaN(index)) index = pathSegments[0];

        if (pathSegments.length < 2) {

            currentSegmentObject[index] = val;
            return;
        }

        const nextIndex = parseInt(pathSegments[1]);
        const newItem = isNaN(nextIndex) ? {} : arrayList(nextIndex + 1);

        if (!currentSegmentObject[index]) currentSegmentObject[index] = newItem;

        pathSegments.shift();
        implodePaths(currentSegmentObject[index], pathSegments, val);
    }


    function insertFieldIntoDocument(objectStruct: any, field: any, fieldOfRow: any) {

        if (field.includes(PATH_SEP)) implodePaths(objectStruct, field.split(PATH_SEP), fieldOfRow);
        else (objectStruct as any)[field] = fieldOfRow;
    }


    function makeObjectStruct(headings: string[]) {

        return reduce((objectStruct, fieldOfRow, i: number) => {

            if (fieldOfRow) insertFieldIntoDocument(objectStruct, headings[i], fieldOfRow);
            return objectStruct as ObjectStruct;

        }, {}); // TODO make reduceObject function
    }
}