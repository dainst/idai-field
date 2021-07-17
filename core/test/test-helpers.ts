import {sameset} from 'tsfun/src/comparator';
import { ResourceId } from '../src/constants';
import {Datastore} from '../src/datastore/datastore';
import { Category, FeatureDocument, Field, FieldDocument, Relation } from '../src/model';
import { Document, toResourceId } from '../src/model/document';
import { Tree } from '../src/tools/forest';
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



export const doc1 = (id, identifier, category): Document => {

    return doc('', identifier, category, id);
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
            if (type === 'Image') relationsLookup[id][Relation.Image.DEPICTS] = targets;
            
            for (const target of targets) {
                relationsLookup[target][type === 'Image' ? Relation.Image.ISDEPICTEDIN : Relation.Hierarchy.LIESWITHIN] = [id];
                if (type === 'Trench') relationsLookup[target][Relation.Hierarchy.RECORDEDIN] = [id];
            }
        }
    }
    for (const doc of Object.values(documentsLookup)) {
        if (doc.resource.relations['liesWithin']) {
            const target = documentsLookup[doc.resource.relations['liesWithin'][0]];
            if (target.resource.relations['isRecordedIn'] && target.resource.relations['isRecordedIn'].length > 0) {
                doc.resource.relations['isRecordedIn'] = target.resource.relations['isRecordedIn'];
            }
        }
    }

    return documentsLookup;
}


export const createCategory = (name: string): Tree<Category> => ({
    item: {
        name,
        categoryName: name,
        label: {},
        isAbstract: false,
        children: [],
        parentCategory: undefined,
        description: {},
        color: '',
        groups: [
            { 
                name: 'stem', 
                fields: [
                    { 
                        name: 'shortDescription', 
                        fulltextIndexed: true,
                        inputType: Field.InputType.INPUT
                    }
                ]
            }
        ],
        mustLieWithin: undefined
    },
    trees: []
});


export function makeExpectDocuments(datastore: Datastore) {

    return async function expectDocuments(...resourceIds: string[]) {

        const documents = (await datastore.find({})).documents;
        expect(sameset(documents.map(toResourceId), resourceIds)).toBeTruthy();
    }
}
