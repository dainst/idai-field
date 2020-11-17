import {FieldReadDatastore} from '../datastore/field/field-read-datastore';
import {Query} from '../datastore/model/query';
import {flatten, isDefined} from 'tsfun';
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
             // TODO operating system?

        const idsOfRelatedDocuments = flatten(
            documents
                .map(document => document.resource.relations['isDepictedIn'])
                .filter(isDefined));

        const relatedImageDocuments = [];
        for (let id of idsOfRelatedDocuments) {
            const document = await datastore.get(id); // TODO handle possible errors
            relatedImageDocuments.push(document);
        }
        // TODO prune relations from image documents to other documents than the types to be exported
        // TODO make sure the imported images cannot be deleted or edited directly
        // TODO implement deletion of imported catalogs, together with all types and images

        fs.writeFileSync(
            outputFilePath,
            documents
                .concat(relatedImageDocuments)
                .map(document => {
                    delete document['_attachments'];
                    delete document['_rev'];
                    delete document['created'];
                    delete document['modified'];
                    return document;
                })
                .map(jsonObject => JSON.stringify(jsonObject))
                .join('\n'));
    }
}
