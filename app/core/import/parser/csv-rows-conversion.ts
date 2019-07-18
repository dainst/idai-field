import {reduce, map, ObjectStruct, arrayList} from 'tsfun';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module CsvRowsConversion {

    const PATH_SEPARATOR = '.';


    export function parse(separator: string) { return (rows: string[]): Array<ObjectStruct> => {

        if (rows.length < 1) return [];
        const headings = splitRow(rows[0], separator);
        rows.shift();

        return map((row: string) => makeObjectStruct(headings)(splitRow(row, separator)))(rows);
    }}


    function makeObjectStruct(headings: string[]) {

        return reduce((objectStruct, fieldOfRow, i: number) => {
            if (fieldOfRow) insertFieldIntoDocument(objectStruct, headings[i], fieldOfRow);
            return objectStruct as ObjectStruct;
        }, {});
    }


    function insertFieldIntoDocument(objectStruct: any, field: any, fieldOfRow: any) {

        if (field.includes(PATH_SEPARATOR)) {
            implodePaths(objectStruct, field.split(PATH_SEPARATOR), fieldOfRow);
        } else {
            (objectStruct as any)[field] = fieldOfRow;
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
        const newItem = isNaN(nextIndex) ? {} : arrayList(nextIndex + 1);

        if (!currentSegmentObject[index]) currentSegmentObject[index] = newItem;

        pathSegments.shift();
        implodePaths(currentSegmentObject[index], pathSegments, val);
    }


    function splitRow(row: string, separator: string): string[] {

        let result: string[] = [];
        let currentField: string = '';
        let inQuotes: boolean = false;
        let lastQuote: boolean = false;

        for (let character of row) {
            switch(character) {
                case '"':
                    if (lastQuote) {
                        currentField += '"';
                        lastQuote = false;
                    } else {
                        lastQuote = true;
                    }
                    break;
                case separator:
                    if (lastQuote) {
                        inQuotes = !inQuotes;
                        lastQuote = false;
                    }
                    if (inQuotes) {
                        currentField += separator;
                    } else {
                        if (currentField === '"') currentField = '';
                        result.push(currentField);
                        currentField = '';
                    }
                    break;
                default:
                    if (lastQuote) {
                        inQuotes = !inQuotes;
                        lastQuote = false;
                    }
                    currentField += character;
                    break;
            }
        }

        if (currentField === '"') currentField = '';
        result.push(currentField);

        return result;
    }
}