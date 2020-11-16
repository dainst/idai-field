import {FieldReadDatastore} from '../datastore/field/field-read-datastore';


export module CatalogExporter {

    export async function performExport(datastore: FieldReadDatastore,
                                        outputFilePath: string,
                                        catalogId: string): Promise<void> {

        console.log("perform catalog export", catalogId, outputFilePath);
    }
}
