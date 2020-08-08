import {Document} from 'idai-components-2';
import {ImportValidator} from './import-validator';
import {processRelations} from './process-relations';
import {Get} from '../types';
import {ImportOptions} from '../import-documents';
import {InverseRelationsMap} from '../../../configuration/inverse-relations-map';


export async function process(processedDocuments: Array<Document>, // TODO get rid of this function
                              validator: ImportValidator,
                              operationCategoryNames: string[],
                              get: Get,
                              inverseRelationsMap: InverseRelationsMap,
                              importOptions: ImportOptions = {})
        : Promise<[Array<Document>, Array<Document>, string[]|undefined]> {

    try {
        const relatedDocuments = await processRelations(
            processedDocuments,
            validator,
            operationCategoryNames,
            get,
            inverseRelationsMap,
            importOptions
        );

        return [processedDocuments, relatedDocuments, undefined];

    } catch (errWithParams) {

        return [[],[], errWithParams];
    }
}
