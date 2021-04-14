import { Either } from 'tsfun';
import { Query, Document, Name, ImageDocument, Datastore } from 'idai-field-core';


export type QueryId = string;

export type TotalCount = number;

export type ErrMsgs = Array<Array<any>>;

export type Result = [Array<ImageDocument>, TotalCount, QueryId];


export async function getImageSuggestions(datastore: Datastore,
                                          imageCategoryNames: Array<Name>,
                                          document: Document,
                                          mode: 'depicts'|'layers',
                                          queryId: QueryId,
                                          queryString: string,
                                          limit: number,
                                          offset: number): Promise<Either<ErrMsgs, Result>> {

    const query: Query = {
        q: queryString,
        limit: limit,
        offset: offset,
        categories: imageCategoryNames,
        constraints: {
            'project:exist': { value: 'KNOWN', subtract: true }
        },
        id: queryId
    };

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
               result.documents.map(ImageDocument.fromDocument),
               result.totalCount,
               result.queryId
            ]
        ];

    } catch (errWithParams) {

        // TODO test handling of messages in imagepickercomponent manually
        const msgs = [['Error in find with query', query]];
        if (errWithParams.length === 2) {
            msgs.push(['Error in find', errWithParams[1]]);
        }
        return [msgs, undefined];
    }
}
