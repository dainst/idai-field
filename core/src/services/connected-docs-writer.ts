import { flatMap, flow, subtract } from 'tsfun';
import { Document, toResourceId  } from '../model/document';
import { Resource } from '../model/resource';
import { Relation } from '../model/configuration/relation';
import { Datastore } from '../datastore/datastore';
import { updateRelations } from './utilities/update-relations';
import { Name } from '../tools/named';


/**
 * Architecture note: This class deals with automatic
 * update of documents directly connected
 * to a document via relations.
 *
 * Other operations, like correcting documents' isRecordedIn relations
 * or hierarchical deletions is done in persistence manager.
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class ConnectedDocsWriter {

    constructor(private datastore: Datastore) {}


    public async updateConnectedDocumentsForDocumentUpdate(relationNames: Array<Name>,
                                                           inverseRelationsMap: Relation.InverseRelationsMap, 
                                                           document: Document, 
                                                           otherVersions: Array<Document>) {

        const connectedDocs = await this.getExistingConnectedDocs(relationNames, [document].concat(otherVersions));

        const docsToUpdate = updateRelations(
            document,
            connectedDocs,
            inverseRelationsMap,
            true
        );

        await this.updateDocs(docsToUpdate);
    }


    public async updateConnectedDocumentsForDocumentRemove(relationNames: Array<Name>,
                                                           inverseRelationsMap: Relation.InverseRelationsMap,
                                                           document: Document) {

        const connectedDocs = await this.getExistingConnectedDocsForRemove(relationNames, document);

        const docsToUpdate = updateRelations(
            document,
            connectedDocs,
            inverseRelationsMap,
            false
        );

        await this.updateDocs(docsToUpdate);
    }


    private async updateDocs(docsToUpdate: Array<Document>) {

        // Note that this does not update a document for being target of isRecordedIn
        for (let docToUpdate of docsToUpdate) {
            await this.datastore.update(docToUpdate, undefined);
        }
    }


    private async getExistingConnectedDocs(relationNames: Array<Name>, documents: Array<Document>) {

        const uniqueConnectedDocIds = ConnectedDocsWriter.getUniqueConnectedDocumentsIds(
            documents, relationNames);

        return this.getDocumentsForIds(uniqueConnectedDocIds, id => {
            console.warn('connected document not found', id);
        })
    }


    private async getExistingConnectedDocsForRemove(relationNames: Array<Name>, document: Document) {

        const uniqueConnectedDocIds = ConnectedDocsWriter.getUniqueConnectedDocumentsIds(
            [document], relationNames);

        const liesWithinTargets = Resource.getRelationTargets(document.resource, ['liesWithin']);
        const recordedInTargets = Resource.getRelationTargets(document.resource, ['isRecordedIn']);

        return this.getDocumentsForIds(uniqueConnectedDocIds, id => {
            if (liesWithinTargets.includes(id) || recordedInTargets.includes(id)) {
                // this can happen due to deletion order during deletion with descendants
            } else {
                console.warn('connected document not found', id);
            }
        });
    }


    private async getDocumentsForIds(ids: string[], handleError: (id: string) => void) {

        const connectedDocuments: Array<Document> = [];
        for (let id of ids) {

            try {
                connectedDocuments.push(await this.datastore.get(id));
            } catch {
                handleError(id);
            }
        }
        return connectedDocuments;
    }


    private static getUniqueConnectedDocumentsIds(documents: Array<Document>, 
                                                  allowedRelations: string[]) {

        const getAllRelationTargetsForDoc = (doc: Document): string[] =>
            Resource.getRelationTargets(doc.resource, allowedRelations);

        return flow(
            documents,
            flatMap(getAllRelationTargetsForDoc),
            subtract(documents.map(toResourceId)));
    }
}
