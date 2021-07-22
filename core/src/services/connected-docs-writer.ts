import { flatMap, flow, subtract } from 'tsfun';
import { Document, toResourceId  } from '../model/document';
import { Resource } from '../model/resource';
import { Relation } from '../model/configuration/relation';
import { Datastore } from '../datastore/datastore';
import { updateRelations } from './utilities/update-relations';
import { Named } from '../tools/named';
import { ProjectConfiguration } from './project-configuration';


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

    private inverseRelationsMap: Relation.InverseRelationsMap;

    constructor(
        private datastore: Datastore,
        private projectConfiguration: ProjectConfiguration) {

        this.inverseRelationsMap = Relation.makeInverseRelationsMap(projectConfiguration.getRelations());
    }


    public async updateConnectedDocumentsForDocumentUpdate(document: Document, otherVersions: Array<Document>) {

        const connectedDocs = await this.getExistingConnectedDocs([document].concat(otherVersions));

        const docsToUpdate = updateRelations(
            document,
            connectedDocs,
            this.inverseRelationsMap,
            true
        );

        await this.updateDocs(docsToUpdate);
    }


    public async updateConnectedDocumentsForDocumentRemove(document: Document) {

        const connectedDocs = await this.getExistingConnectedDocsForRemove(document);

        const docsToUpdate = updateRelations(
            document,
            connectedDocs,
            this.inverseRelationsMap,
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


    private getRelationNames() {

        return this.projectConfiguration
            .getRelations()
            .map(Named.toName);
    }


    private async getExistingConnectedDocs(documents: Array<Document>) {

        const uniqueConnectedDocIds = ConnectedDocsWriter.getUniqueConnectedDocumentsIds(
            documents, this.getRelationNames());

        return this.getDocumentsForIds(uniqueConnectedDocIds, id => {
            console.warn('connected document not found', id);
        })
    }


    private async getExistingConnectedDocsForRemove(document: Document) {

        const uniqueConnectedDocIds = ConnectedDocsWriter.getUniqueConnectedDocumentsIds(
            [document], this.getRelationNames());

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


    private static getUniqueConnectedDocumentsIds(documents: Array<Document>, allowedRelations: string[]) {

        const getAllRelationTargetsForDoc = (doc: Document): string[] =>
            Resource.getRelationTargets(doc.resource, allowedRelations);

        return flow(
            documents,
            flatMap(getAllRelationTargetsForDoc),
            subtract(documents.map(toResourceId)));
    }
}
