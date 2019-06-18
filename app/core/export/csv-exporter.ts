import {FieldDocument, IdaiType} from 'idai-components-2';
import {to} from 'tsfun/src/objectstruct';
import {is, isnt} from 'tsfun';

/**
 * @author Daniel de Oliveira
 */
export module CSVExporter {

    // should return a structure which can be written to a file
    export function createExportable(documents: FieldDocument[],
                                     resourceType: IdaiType) {


        // compile the first line from the type's fields
        const fieldNames = resourceType.fields.map(to('name'));

        if (documents.length === 0) return [fieldNames.join(', ')];

        return documents.map(arrangeBy(fieldNames));
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