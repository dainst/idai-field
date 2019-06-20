import {FieldDocument, IdaiType} from 'idai-components-2';
import {isnt, flow, to, map, copy} from 'tsfun';


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
                map(expandArrayToSize(indexOfDatingElement, max)),
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

        return expandHomogeneousItems(indexOfDatingElement, max, 4,
            (removed: any) => {

                return [
                    JSON.stringify(removed['begin']),
                    JSON.stringify(removed['end']),
                    removed['source'],
                    removed['label']];
            });
    }


    function expandArrayToSize(where: number, targetSize: number) {

        return expandHomogeneousItems(where, 1, targetSize, identity);
    }


    function expandHomogeneousItems(where: number, nrOfNewItems: number, widthOfEachNewItem: number,
                    computeReplacement: (removed: any) => any[]) {

        return (itms: any[]) => {


            for (let i = nrOfNewItems - 1; i >= 0; i--) {

                const removed = itms.splice(where + i, 1, ...Array(widthOfEachNewItem))[0];
                if (removed) {
                    const newEls = computeReplacement(removed);
                    for (let j = 0; j < newEls.length; j++) itms[where + i + j] = newEls[j];
                }
            }

            return itms;
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


    const identity = (_: any) => _; // TODO move to tsfun or expose tsfuns identical
}