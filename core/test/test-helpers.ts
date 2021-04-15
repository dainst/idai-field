import { Document } from '../src/model/document';
import { ResourceId } from '../src/constants';
import { FeatureDocument, FieldDocument, Relations } from '../src/model';
import { Lookup } from '../src/tools/utils';


export const fieldDoc = (sd, identifier?, category?, id?) =>
    doc(sd, identifier, category, id) as unknown as FieldDocument;


export const featureDoc = (sd, identifier?, category?, id?) => {

    const newDoc = doc(sd, identifier, category, id) as unknown as FeatureDocument;
    newDoc.resource.relations.isContemporaryWith = [];
    newDoc.resource.relations.isBefore = [];
    newDoc.resource.relations.isAfter = [];
    return newDoc;
};


export const doc = (sd, identifier?, category?, id?): Document => {

    if (!identifier) identifier = 'identifer';
    if (!category) category = 'Find';
    const newDoc: Document = {
        _id: 'A',
        resource : {
            id: 'A',
            shortDescription: sd,
            identifier: identifier,
            title: 'title',
            category: category,
            relations : {}
        },
        created: {
            user: 'anonymous',
            date: new Date()
        },
        modified: [
            {
                user: 'anonymous',
                date: new Date()
            }
        ]
    };
    if (id) {
        newDoc._id = id;
        newDoc.resource.id = id;
    } else delete newDoc.resource.id;
    return newDoc as Document;
};


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
        const d = doc('', 'identifier' + id, type, id) as FieldDocument;
        if (type !== 'Image') d.resource.relations = { isRecordedIn: [] };
        relationsLookup[id] = d.resource.relations;
        documentsLookup[id] = d;
    }
    for (const [id, type, targets] of documents) {
        if (targets) {
            if (type === 'Image') relationsLookup[id][Relations.Image.DEPICTS] = targets;

            for (const target of targets) {
                relationsLookup[target][type === 'Image' ? Relations.Image.ISDEPICTEDIN : Relations.Hierarchy.LIESWITHIN] = [id];
            }
        }
    }

    return documentsLookup;
}
