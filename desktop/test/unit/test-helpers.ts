import {Document} from 'idai-components-2';
import {FieldDocument} from '@idai-field/core'
import {Lookup} from '../../src/app/core/util/utils';
import {HierarchicalRelations, ImageRelationsC as ImageRelations} from '@idai-field/core';
import {ResourceId} from '../../src/app/core/constants';


export function doc(id: string, category: string = 'category'): Document {

    return {
        _id: id,
        resource: {
            id: id,
            identifier: 'identifier' + id,
            category: category,
            relations: {}
        },
        created:
            {
                date: new Date('2017-12-31'),
                user: 'testuser'
            },
        modified: [
            {
                date: new Date('2018-01-01'),
                user: 'testuser'
            }
        ]
    };
}


/**
 * Document templates.
 *
 * First entry is resourceId.
 * Second entry is category. Either 'Image' or something else.
 * Optional third entry is related documents.
 *   For Image documents these are
 *     the documents the image depicts.
 *   For Non Image documents these are
 *     the documents it contains (via lies within of the targets pointing to the current one as their parent).
 */
export type NiceDocs =
    Array<[ResourceId, string, Array<string>]
        |[ResourceId, string]>;


export function createDocuments(documents: NiceDocs) {

    const documentsLookup: Lookup<FieldDocument> = {}
    const relationsLookup = {};

    for (const [id, type, _] of documents) {
        const d = doc(id, type) as FieldDocument;
        if (type !== 'Image') d.resource.relations = { isRecordedIn: [] };
        relationsLookup[id] = d.resource.relations;
        documentsLookup[id] = d;
    }
    for (const [id, type, targets] of documents) {
        if (targets) {
            if (type === 'Image') relationsLookup[id][ImageRelations.DEPICTS] = targets;

            for (const target of targets) {
                relationsLookup[target][type === 'Image' ? ImageRelations.ISDEPICTEDIN : HierarchicalRelations.LIESWITHIN] = [id];
            }
        }
    }

    return documentsLookup;
}
