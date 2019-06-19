import {FieldDocument, IdaiType} from 'idai-components-2';
import {to} from 'tsfun/src/objectstruct';
import {isnt} from 'tsfun';


/**
 * @author Daniel de Oliveira
 */
export module CSVExport {

    // should return a structure which can be written to a file
    export function createExportable(documents: FieldDocument[],
                                     resourceType: IdaiType) {

        const fieldNames = getUsableFieldNames(resourceType.fields.map(to('name')));

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

            const newLine = new Array(fieldNames.length);

            return getUsableFieldNames(Object.keys(document.resource))
                .reduce((line, fieldName) =>  {

                    const indexOfFoundElement = fieldNames.indexOf(fieldName);
                    if (indexOfFoundElement !== -1) {

                        const field = (document.resource as any)[fieldName];

                        if (fieldName === 'dating') {
                            console.log("dating found", field)
                        }

                        line[indexOfFoundElement] = field;
                    }
                    return line;
                }, newLine);
        }
    }


    function getUsableFieldNames(fieldNames: string[]) {

        return fieldNames
            .filter(isnt('relations'))
            .filter(isnt('type'))
            .filter(isnt('geometry'))  // TODO probably enable later
            .filter(isnt('relations')) // TODO probably enable later
            .filter(isnt('id'));
    }
}