import {FieldDocument, IdaiType} from 'idai-components-2';
import {isnt, flow, to, map} from 'tsfun';


/**
 * @author Daniel de Oliveira
 */
export module CSVExport {

    // TODO expand begin and year fully

    export function createExportable(documents: FieldDocument[],
                                     resourceType: IdaiType) {

        let fieldNames: string[] = getUsableFieldNames(resourceType.fields.map(to('name')));
        let matrix = documents.map(toRowsArrangedBy(fieldNames));

        const indexOfDatingElement = fieldNames.indexOf('dating');
        if (indexOfDatingElement !== -1) {
            const max = getMax(matrix, indexOfDatingElement);
            expandDatingHeader(fieldNames, indexOfDatingElement, max);

            matrix = flow(matrix,
                map(rowsWithDatingFieldsExpanded(indexOfDatingElement, max)),
                map(rowsWithDatingElementsExpanded(indexOfDatingElement, max)));
        }

        return ([fieldNames].concat(matrix)).map(toCsvLine);
    }


    function getMax(matrix: any, indexOfDatingElement: any) {

        return matrix.reduce((max: number, row: any) =>

                Math.max(
                    max,
                    row[indexOfDatingElement]
                        ? row[indexOfDatingElement].length
                        : 0)

            , 0);
    }


    /**
     * @param fieldNames gets modified
     * @param indexOfDatingElement
     * @param max
     */
    function expandDatingHeader(fieldNames: any, indexOfDatingElement: number, max: number) {

        const dating_fields: string[] = [];
        for (let i = 0; i < max; i++) dating_fields.push('dating.' + i);
        fieldNames.splice(indexOfDatingElement, 1, ...dating_fields);

        for (let i = max - 1; i >= 0; i--) {

            const indexOfCurrentDatingElement = indexOfDatingElement + i;
            fieldNames.splice(indexOfCurrentDatingElement, 1, [
                    'dating.' + i + '.begin',
                    'dating.' + i + '.end',
                    'dating.' + i + '.source',
                    'dating.' + i + '.label']);
        }
    }


    function rowsWithDatingElementsExpanded(indexOfDatingElement: number, max: number) {

        return expand(indexOfDatingElement, max, 4,
            (row: any[], removed: any, i: number) => {

                row[indexOfDatingElement + i    ] = JSON.stringify(removed['begin']);
                row[indexOfDatingElement + i + 1] = JSON.stringify(removed['end']);
                row[indexOfDatingElement + i + 2] = removed['source'];
                row[indexOfDatingElement + i + 3] = removed['label'];
            });
    }


    function rowsWithDatingFieldsExpanded(indexOfDatingElement: number, max: number) {

        return expand(indexOfDatingElement, 1, max,
            (row: any[], removed: any) => {

            for (let j = 0; j < removed.length; j++) row[indexOfDatingElement + j] = removed[j];
        });
    }


    function expand(where: number, nrOfNewItems: number, widthOfEachNewItem: number,
                    fun: (row: any[], removed: any, i: number) => void) {

        return (row: any) => {

            for (let i = nrOfNewItems - 1; i >= 0; i--) {

                const removed = row.splice(where + i, 1, ...Array(widthOfEachNewItem))[0];
                if (removed) fun(row, removed, i);
            }

            return row;
        }
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


    const toCsvLine = (as: string[]): string => as.join(',');
}