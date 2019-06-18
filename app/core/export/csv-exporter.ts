import {FieldDocument, IdaiType} from 'idai-components-2';

/**
 * @author Daniel de Oliveira
 */
export module CSVExporter {

    // should return a structure which can be written to a file
    export function createExportable(documents: FieldDocument[],
                                     resourceType: IdaiType) {

        // compile the first line from the type's fields
        return ['one'];
    }
}