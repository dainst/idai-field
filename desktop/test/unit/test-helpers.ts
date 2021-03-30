import { FieldDocument, HierarchicalRelations, ImageRelationsC as ImageRelations } from '@idai-field/core';
import { ResourceId } from '../../src/app/core/constants';
import { Lookup } from '../../src/app/core/util/utils';
import { Static } from './static';


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
        const d = Static.doc('', 'identifier' + id, type, id) as FieldDocument;
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
