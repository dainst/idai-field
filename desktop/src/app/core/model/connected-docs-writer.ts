import { Document, Datastore, Name, Relations, toResourceId } from 'idai-field-core';
import { flatMap, flow, subtract, to } from 'tsfun';
import { InverseRelationsMap, makeInverseRelationsMap } from '../configuration/inverse-relations-map';
import { ProjectConfiguration } from '../configuration/project-configuration';
import { updateRelations } from './update-relations';

const NAME = 'name';

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

    private inverseRelationsMap: InverseRelationsMap;

    constructor(
        private datastore: Datastore,
        private projectConfiguration: ProjectConfiguration) {

        this.inverseRelationsMap = makeInverseRelationsMap(projectConfiguration.getAllRelationDefinitions());
    }


    public async updateConnectedDocumentsForDocumentUpdate(document: Document, otherVersions: Array<Document>, user: Name) {

        const connectedDocs = await this.getExistingConnectedDocs([document].concat(otherVersions));

        const docsToUpdate = updateRelations(
            document,
            connectedDocs,
            this.inverseRelationsMap,
            true
        );

        await this.updateDocs(docsToUpdate, user);
    }


    public async updateConnectedDocumentsForDocumentRemove(document: Document, user: Name) {

        const connectedDocs = await this.getExistingConnectedDocsForRemove(document);

        const docsToUpdate = updateRelations(
            document,
            connectedDocs,
            this.inverseRelationsMap,
            false
        );

        await this.updateDocs(docsToUpdate, user);
    }


    private async updateDocs(docsToUpdate: Array<Document>, user: Name) {

        // Note that this does not update a document for being target of isRecordedIn
        for (let docToUpdate of docsToUpdate) {
            await this.datastore.update(docToUpdate, user, undefined);
        }
    }


    private getRelationDefinitionNames() {

        return this.projectConfiguration
            .getAllRelationDefinitions()
            .map(to(NAME));
    }


    private async getExistingConnectedDocs(documents: Array<Document>) {

        const uniqueConnectedDocIds = ConnectedDocsWriter.getUniqueConnectedDocumentsIds(
            documents, this.getRelationDefinitionNames());

        return this.getDocumentsForIds(uniqueConnectedDocIds, id => {
            console.warn('connected document not found', id);
        })
    }


    private async getExistingConnectedDocsForRemove(document: Document) {

        const uniqueConnectedDocIds = ConnectedDocsWriter.getUniqueConnectedDocumentsIds(
            [document], this.getRelationDefinitionNames());

        const liesWithinTargets = Relations.getAllTargets(document.resource.relations, ['liesWithin']);
        const recordedInTargets = Relations.getAllTargets(document.resource.relations, ['isRecordedIn']);

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
            Relations.getAllTargets(doc.resource.relations, allowedRelations);

        return flow(
            documents,
            flatMap(getAllRelationTargetsForDoc),
            subtract(documents.map(toResourceId)));
    }
}
