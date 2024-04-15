import { Datastore, Document, Query } from 'idai-field-core';


export async function getDocumentSuggestions(datastore: Datastore, query: Query,
                                             includeResourcesWithInvalidParent: boolean): Promise<Array<Document>> {

    return (await datastore
        .find(
            {
                ...query,
                constraints: {
                    ...query.constraints,
                    'project:exist': {
                        value: 'KNOWN',
                        subtract: true
                    }
                }
            },
            { includeResourcesWithoutValidParent: includeResourcesWithInvalidParent }
        )
    ).documents;
}
