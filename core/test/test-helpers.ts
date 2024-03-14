import { sameset, update } from 'tsfun';
import { Datastore } from '../src/datastore/datastore';
import { CategoryForm, FeatureDocument, Field, FieldDocument, Relation } from '../src/model';
import { Document, toResourceId } from '../src/model/document';
import { Resource } from '../src/model/resource';
import { Tree } from '../src/tools/forest';
import { Lookup } from '../src/tools/utils';


export function createMockProjectConfiguration(): any {

    const projectConfiguration = jasmine.createSpyObj(
        'projectConfiguration',
        ['getCategory', 'getCategories', 'getTypeCategories']
    );

    const defaultCategoryConfiguration = {
        name: '',
        groups: [{
            fields: [
                {
                    name: 'identifier',
                    fulltextIndexed: true
                },
                {
                    name: 'shortDescription',
                    fulltextIndexed: true
                }
            ]
        }]
    };

    projectConfiguration.getCategory.and.callFake(categoryName => {
        return update('name', categoryName, defaultCategoryConfiguration);
    });

    projectConfiguration.getCategories.and.returnValue([
        { item: update('name', 'category1', defaultCategoryConfiguration), trees: [] },
        { item: update('name', 'category2', defaultCategoryConfiguration), trees: [] },
        { item: update('name', 'category3', defaultCategoryConfiguration), trees: [] },
        { item: update('name', 'Find', defaultCategoryConfiguration), trees: [] },
        { item: update('name', 'Type', defaultCategoryConfiguration), trees: [] }
    ]);

    projectConfiguration.getTypeCategories.and.returnValue([{ name: 'Type' }]);

    return projectConfiguration;
}


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
    Array<[Resource.Id, string, Array<string>]
        |[Resource.Id, string]>;


export function createDocuments(documents: NiceDocs, project?: string) {

    const documentsLookup: Lookup<FieldDocument> = {}
    const relationsLookup = {};

    for (const [id, type, _] of documents) {
        const d = doc('', 'identifier' + id, type, id) as FieldDocument;
        if (project) d.project = project;
        if (type !== 'Image') d.resource.relations = { isRecordedIn: [] };
        relationsLookup[id] = d.resource.relations;
        documentsLookup[id] = d;
    }
    for (const [id, type, targets] of documents) {
        if (targets) {
            if (type === 'Image') relationsLookup[id][Relation.Image.DEPICTS] = targets;
            
            for (const target of targets) {
                relationsLookup[target][type === 'Image' ? Relation.Image.ISDEPICTEDIN : Relation.Hierarchy.LIESWITHIN] = [id];
                if (type === 'Trench') {
                    relationsLookup[target][Relation.Hierarchy.RECORDEDIN] = [id];
                    delete relationsLookup[target][Relation.Hierarchy.LIESWITHIN];
                }
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


export const createCategory = (name: string): Tree<CategoryForm> => ({
    item: {
        name,
        label: {},
        categoryLabel: {},
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
