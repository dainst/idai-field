import { flatMap, flow, subtract } from 'tsfun';
import { Document, toResourceId  } from '../../model/document';
import { Resource } from '../../model/resource';
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
            datastore.get, relationNames, [document].concat(otherVersions)
        );

        const docsToUpdate = updateRelations(
            document,
            connectedDocs,
            inverseRelationsMap,
            true
        );

        for (const doc of connectedDocs) datastore.convert(doc);

        await updateDocs(datastore.update, docsToUpdate);
    }


    export async function updateForRemove(datastore: Datastore,
                                          relationNames: Array<Name>,
                                          inverseRelationsMap: Relation.InverseRelationsMap,
                                          document: Document) {

        const connectedDocs = await getExistingConnectedDocsForRemove(datastore.get, relationNames, document);

        const docsToUpdate = updateRelations(
            document,
            connectedDocs,
            inverseRelationsMap,
            false
        );

        await updateDocs(datastore.update, docsToUpdate);
    }


    async function updateDocs(update: Datastore.Update, docsToUpdate: Array<Document>) {

        // Note that this does not update a document for being target of isRecordedIn
        for (let docToUpdate of docsToUpdate) {
            await update(docToUpdate, undefined);
        }
    }


    async function getExistingConnectedDocs(get: Datastore.Get, 
                                            relationNames: Array<Name>, 
                                            documents: Array<Document>) {

        const uniqueConnectedDocIds = getUniqueConnectedDocumentsIds(
            documents, relationNames);

        return getDocumentsForIds(get, uniqueConnectedDocIds, id => {
            console.warn('connected document not found', id);
        })
    }


    async function getExistingConnectedDocsForRemove(get: Datastore.Get, relationNames: Array<Name>, document: Document) {

        const uniqueConnectedDocIds = getUniqueConnectedDocumentsIds(
            [document], relationNames);

        const liesWithinTargets = Resource.getRelationTargets(document.resource, ['liesWithin']);
        const recordedInTargets = Resource.getRelationTargets(document.resource, ['isRecordedIn']);

        return getDocumentsForIds(get, uniqueConnectedDocIds, id => {
            if (liesWithinTargets.includes(id) || recordedInTargets.includes(id)) {
                // this can happen due to deletion order during deletion with descendants
            } else {
                console.warn('connected document not found', id);
            }
        });
    }


    async function getDocumentsForIds(get: Datastore.Get, 
                                      ids: string[], 
                                      handleError: (id: string) => void) {

        const connectedDocuments: Array<Document> = [];
        for (let id of ids) {

            try {
                connectedDocuments.push(await get(id));
            } catch {
                handleError(id);
            }
        }
        return connectedDocuments;
    }


    function getUniqueConnectedDocumentsIds(documents: Array<Document>, 
                                            allowedRelations: string[]) {

        const getAllRelationTargetsForDoc = (doc: Document): string[] =>
            Resource.getRelationTargets(doc.resource, allowedRelations);

        return flow(
            documents,
            flatMap(getAllRelationTargetsForDoc),
            subtract(documents.map(toResourceId)));
    }
}
