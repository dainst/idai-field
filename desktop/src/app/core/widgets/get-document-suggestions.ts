import { Datastore, FieldDocument, Query } from 'idai-field-core';


export async function getDocumentSuggestions(datastore: Datastore,
                                             query: Query): Promise<Array<FieldDocument>> {

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
            }
        ))
        .documents
        .map(FieldDocument.fromDocument);
}
