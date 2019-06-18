import {FieldDocument, IdaiType} from 'idai-components-2';
import {to} from 'tsfun/src/objectstruct';
import {isnt} from 'tsfun';

/**
 * @author Daniel de Oliveira
 */
export module CSVExporter {

    // should return a structure which can be written to a file
    export function createExportable(documents: FieldDocument[],
                                     resourceType: IdaiType) {

        const fieldNames = resourceType.fields.map(to('name'));

        return [fieldNames.join(', ')].concat(
            documents
                .map(arrangeBy(fieldNames))
                .map(toCsvLine));
    }


    function toCsvLine(as: string[]): string {

        return as.join(', ');
    }


    function arrangeBy(fieldNames: string[]) {

        return (document: FieldDocument) => {

            return getFieldNames(document).reduce((line, fieldName) =>  {

                const indexOfFoundElement = fieldNames.indexOf(fieldName);
                if (indexOfFoundElement !== -1) {
                    line[indexOfFoundElement] = (document.resource as any)[fieldName];
                }
                return line;
            }, new Array(fieldNames.length));
        }
    }


    function getFieldNames(document: FieldDocument) {

        return Object.keys(document.resource)
            .filter(isnt('relations'))
            .filter(isnt('type'))
            .filter(isnt('id'));
    }
}