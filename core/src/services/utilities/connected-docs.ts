import { flatMap, flow, subtract } from 'tsfun';
import { Document, toResourceId  } from '../../model/document/document';
import { Resource } from '../../model/document/resource';
import { Relation } from '../../model/configuration/relation';
import { Datastore } from '../../datastore/datastore';
import { updateRelations } from './update-relations';
import { Name } from '../../tools/named';


/**
 * Architecture note: This class deals with automatic
 * update of documents directly connected
 * to a document via relations.
 *
 * Other operations, like correcting documents' isRecordedIn relations
 * or hierarchical deletions is done in relations manager.
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export namespace ConnectedDocs {

    export async function updateForUpdate(datastore: Datastore,
                                          relationNames: Array<Name>,
                                          inverseRelationsMap: Relation.InverseRelationsMap,
                                          document: Document,
                                          otherVersions: Array<Document>) {

        const connectedDocs = await getExistingConnectedDocs(
            datastore, relationNames, [document].concat(otherVersions)
        );

        const docsToUpdate = updateRelations(
            document,
            connectedDocs,
            inverseRelationsMap,
            true
        );

        for (const doc of docsToUpdate) {
            await datastore.convert(doc);
        }

        await updateDocs(datastore, docsToUpdate);
    }


    export async function updateForRemove(datastore: Datastore,
                                          relationNames: Array<Name>,
                                          inverseRelationsMap: Relation.InverseRelationsMap,
                                          document: Document) {

        const connectedDocs = await getExistingConnectedDocsForRemove(datastore, relationNames, document);

        const docsToUpdate = updateRelations(
            document,
            connectedDocs,
            inverseRelationsMap,
            false
        );

        await updateDocs(datastore, docsToUpdate);
    }


    async function updateDocs(datastore: Datastore, docsToUpdate: Array<Document>) {

        // Note that this does not update a document for being target of isRecordedIn
        for (let docToUpdate of docsToUpdate) {
            await datastore.update(docToUpdate, undefined);
        }
    }


    async function getExistingConnectedDocs(datastore: Datastore, relationNames: Array<Name>, 
                                            documents: Array<Document>) {

        const uniqueConnectedDocIds = getUniqueConnectedDocumentsIds(documents, relationNames, datastore);

        return getDocumentsForIds(datastore, uniqueConnectedDocIds, id => {
            console.warn('connected document not found', id);
        })
    }


    async function getExistingConnectedDocsForRemove(datastore: Datastore, relationNames: Array<Name>,
                                                     document: Document) {

        const uniqueConnectedDocIds = getUniqueConnectedDocumentsIds([document], relationNames, datastore);

        const liesWithinTargets = Resource.getRelationTargets(document.resource, ['liesWithin']);
        const recordedInTargets = Resource.getRelationTargets(document.resource, ['isRecordedIn']);

        return getDocumentsForIds(datastore, uniqueConnectedDocIds, id => {
            if (liesWithinTargets.includes(id) || recordedInTargets.includes(id)) {
                // this can happen due to deletion order during deletion with descendants
            } else {
                console.warn('connected document not found', id);
            }
        });
    }


    async function getDocumentsForIds(datastore: Datastore,  ids: string[], handleError: (id: string) => void) {

        const connectedDocuments: Array<Document> = [];
        for (let id of ids) {
            try {
                connectedDocuments.push(await datastore.get(id));
            } catch {
                handleError(id);
            }
        }
        return connectedDocuments;
    }


    function getUniqueConnectedDocumentsIds(documents: Array<Document>,  allowedRelations: string[],
                                            datastore: Datastore) {

        const getAllRelationTargetsForDoc = (doc: Document): string[] =>
            Resource.getRelationTargets(doc.resource, allowedRelations)
                .concat(getPresentInDocumentIds(doc, datastore));

        return flow(
            documents,
            flatMap(getAllRelationTargetsForDoc),
            subtract(documents.map(toResourceId)));
    }


    function getPresentInDocumentIds(document: Document, datastore: Datastore): string[] {

        if (!document.resource.id) return [];

        return datastore.findIds({
            constraints: {
                'isPresentIn:contain': document.resource.id
            }
        }).ids;
    }
}
