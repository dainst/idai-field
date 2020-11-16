import {FieldReadDatastore} from '../datastore/field/field-read-datastore';
import {Query} from '../datastore/model/query';
const fs = typeof window !== 'undefined' ? window.require('fs') : require('fs');


export module CatalogExporter {

    export async function performExport(datastore: FieldReadDatastore,
                                        outputFilePath: string,
                                        catalogId: string): Promise<void> {

        const typeCatalog = await datastore.get(catalogId);
        const typesQuery: Query = {
            constraints: {
                'liesWithin:contain': {
                    value: catalogId,
                    searchRecursively: true
                }
            }
        };
        const types = (await datastore.find(typesQuery)).documents;
        const documents = [typeCatalog].concat(types)
            .map(jsonObject => JSON.stringify(jsonObject))
            .join('\n'); // TODO operating system?

        fs.writeFileSync(outputFilePath, documents);
    }
}
