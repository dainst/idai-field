import { Either, update } from 'tsfun';
import { Query, Document, ImageDocument, Datastore } from 'idai-field-core';


export type TotalCount = number;

export type ErrMsgs = Array<Array<any>>;

export type Result = [Array<ImageDocument>, TotalCount];


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export async function getImageSuggestions(datastore: Datastore,
                                          document: Document,
                                          mode: 'depicts'|'layers',
                                          query_: Query): Promise<Either<ErrMsgs, Result>> {

    const query = update('constraints', {'project:exist': { value: 'KNOWN', subtract: true }}, query_);

    if (mode === 'depicts') {
        query.constraints['depicts:contain'] = { value: document.resource.id, subtract: true };
    } else {
        query.constraints['georeference:exist'] = { value: 'KNOWN' };
        query.constraints['isMapLayerOf:exist'] = { value: 'UNKNOWN' };
        if (document.resource.relations['hasMapLayer']) {
            query.constraints['id:match'] = { value: document.resource.relations['hasMapLayer'], subtract: true };
        }
    }

    try {
        const result = await datastore.find(query);
        return [
            undefined,
            [
               result.documents as Array<ImageDocument>,
               result.totalCount
            ]
        ];
    } catch (errWithParams) {

        const msgs = [['Error in find with query', query]];
        if (errWithParams.length === 2) {
            msgs.push(['Error in find', errWithParams[1]]);
        }
        return [msgs, undefined];
    }
}
