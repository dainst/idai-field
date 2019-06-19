import {FieldDocument, IdaiType} from 'idai-components-2';
import {to} from 'tsfun/src/objectstruct';
import {isnt} from 'tsfun';


/**
 * @author Daniel de Oliveira
 */
export module CSVExport {


    export function createExportable(documents: FieldDocument[],
                                     resourceType: IdaiType) {

        let fieldNames: string[] = getUsableFieldNames(resourceType.fields.map(to('name')));
        let matrix = documents.map(toRowsArrangedBy(fieldNames));

        const indexOfDatingElement = fieldNames.indexOf('dating');
        if (indexOfDatingElement !== -1) {
            const max = getMax(matrix, indexOfDatingElement);
            expandDatingHeader(fieldNames, indexOfDatingElement, max);
            matrix = matrix.map(expandRow(indexOfDatingElement, max));
        }

        return ([fieldNames].concat(matrix)).map(toCsvLine);
    }


    function getMax(matrix: any, indexOfDatingElement: any) {

        return matrix.reduce(
            (max: number, row: any) => Math.max(max, row[indexOfDatingElement] ? row[indexOfDatingElement].length : 0), 0);
    }


    /**
     * @param fieldNames gets modified
     * @param indexOfDatingElement
     * @param max
     */
    function expandDatingHeader(fieldNames: any, indexOfDatingElement: any, max: number) {

        const dating_fields: string[] = [];
        for (let i = 0; i < max; i++) dating_fields.push('dating:' + i);
        fieldNames.splice(indexOfDatingElement, 1, ...dating_fields);
    }


    function expandRow(indexOfDatingElement: any, max: number) {

        return (row: any) => {

            const temp = row[indexOfDatingElement];

            row.splice(indexOfDatingElement, 1, new Array(max));
            for (let i in temp) row[indexOfDatingElement][i] = temp[i];
            return row;
        }
    }


    function toCsvLine(as: string[]): string {

        return as.join(',');
    }


    function toRowsArrangedBy(fieldNames: string[]) {

        return (document: FieldDocument) => {

            const newLine = new Array(fieldNames.length);

            return getUsableFieldNames(Object.keys(document.resource))
                .reduce((line, fieldName) =>  {

                    const indexOfFoundElement = fieldNames.indexOf(fieldName);
                    if (indexOfFoundElement !== -1) {

                        line[indexOfFoundElement] = (document.resource as any)[fieldName];
                    }
                    return line;
                }, newLine);
        }
    }


    function getUsableFieldNames(fieldNames: string[]): string[] {

        return fieldNames
            .filter(isnt('relations'))
            .filter(isnt('type'))
            .filter(isnt('geometry'))  // TODO probably enable later
            .filter(isnt('relations')) // TODO probably enable later
            .filter(isnt('id'));
    }
}