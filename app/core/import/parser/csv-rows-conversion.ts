import {reduce, map, ObjectStruct, arrayList} from 'tsfun';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module CsvRowsConversion {

    const PATH_SEPARATOR = '.';


    export function parse(separator: string) {

        return (content: string): Array<ObjectStruct> => {
            const rows: string[][] = getRows(content, separator);
            if (rows.length < 0) return [];

            const headings: string[] = rows.shift() as string[];

            return map((row: string[]) => makeObjectStruct(headings)(row))(rows);
        }
    }


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


    function getRows(content: string, separator: string): string[][] {

        let rows: string[][] = [];
        let currentRow: string[] = [];
        let currentField: string = '';

        let inQuotes: boolean = false;
        let lastCharacter: 'quote'|'linebreak'|'other' = 'other';

        for (let character of content) {
            switch(character) {
                case '"':
                    if (lastCharacter === 'quote') {
                        currentField += '"';
                        lastCharacter = 'other';
                    } else {
                        lastCharacter = 'quote';
                    }
                    break;
                case separator:
                    if (lastCharacter === 'quote') inQuotes = !inQuotes;
                    if (inQuotes) {
                        currentField += separator;
                    } else {
                        addFieldToRow(currentField, currentRow);
                        currentField = '';
                    }
                    lastCharacter = 'other';
                    break;
                case '\n':
                case '\r':
                    if (lastCharacter === 'quote') inQuotes = !inQuotes;
                    if (lastCharacter !== 'linebreak') {
                        if (inQuotes) {
                            currentField += '\n';
                        } else {
                            addFieldToRow(currentField, currentRow);
                            rows.push(currentRow);
                            currentField = '';
                            currentRow = [];
                            lastCharacter = 'linebreak';
                        }
                    }
                    break;
                default:
                    if (lastCharacter === 'quote') inQuotes = !inQuotes;
                    lastCharacter = 'other';
                    currentField += character;
                    break;
            }
        }

        if (currentField !== '') addFieldToRow(currentField, currentRow);
        if (currentRow.length > 0) rows.push(currentRow);

        return rows;
    }


    function addFieldToRow(field: string, row: string[]) {

        if (field === '"') field = '';
        row.push(field);
    }
}