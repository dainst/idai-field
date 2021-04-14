import * as tsfun from 'tsfun';
import { Constraint, Datastore, FieldDocument, Query } from 'idai-field-core';


export type QueryId = string;
export type GetConstraints = () => Promise<{ [name: string]: string|Constraint }>;


export async function getDocumentSuggestions(datastore: Datastore,
                                             getConstraints: GetConstraints|undefined,
                                             query: Query): Promise<[Array<FieldDocument>, QueryId]> {

    const clonedQuery = tsfun.clone(query);
    if (getConstraints) clonedQuery.constraints = await getConstraints();
    if (clonedQuery.constraints === undefined) clonedQuery.constraints = {};
    clonedQuery.constraints['project:exist'] = { value: 'KNOWN', subtract: true };
    const result = await datastore.find(clonedQuery);

    return [result.documents.map(FieldDocument.fromDocument), result.queryId];
}
