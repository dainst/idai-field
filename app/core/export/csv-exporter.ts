import {FieldDocument, IdaiType} from 'idai-components-2';
import {to} from 'tsfun/src/objectstruct';

/**
 * @author Daniel de Oliveira
 */
export module CSVExporter {

    // should return a structure which can be written to a file
    export function createExportable(documents: FieldDocument[],
                                     resourceType: IdaiType) {


        if (documents.length > 0) return [];

        // compile the first line from the type's fields
        const fieldNames = resourceType.fields.map(to('name'));
        return [fieldNames.join(', ')];
    }
}