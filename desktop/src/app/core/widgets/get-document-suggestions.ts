import * as tsfun from 'tsfun';
import { Datastore, FieldDocument, Query } from 'idai-field-core';


export async function getDocumentSuggestions(datastore: Datastore,
                                             query: Query): Promise<Array<FieldDocument>> {

    const clonedQuery = tsfun.clone(query);
    if (clonedQuery.constraints === undefined) clonedQuery.constraints = {};
    clonedQuery.constraints['project:exist'] = { value: 'KNOWN', subtract: true };
    const result = await datastore.find(clonedQuery);

    return result.documents.map(FieldDocument.fromDocument);
}
