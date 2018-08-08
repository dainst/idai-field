import {Injectable} from '@angular/core';
import {Document, NewDocument, ProjectConfiguration, Relations, toResourceId} from 'idai-components-2/core';
import {ConnectedDocsResolution} from './connected-docs-resolution';
import {DocumentDatastore} from '../datastore/document-datastore';
import {filter, flatMap, flow, includedIn, isNot, mapTo, on, subtract, to} from 'tsfun';

@Injectable()
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class PersistenceWriter {

    constructor(
        private datastore: DocumentDatastore,
        private projectConfiguration: ProjectConfiguration
    ) {}


    public async write(document: Document,
                       otherVersions: Array<Document>,
                       username: string,
                       deletion: boolean): Promise<void> {

        const connectedDocs = await this.getExistingConnectedDocs(
            [document].concat(otherVersions));

        const docsToUpdate = ConnectedDocsResolution.determineDocsToUpdate(
            this.projectConfiguration, document,
            connectedDocs, !deletion);

        // Note that this does not update a document for beeing target of isRecordedIn
        for (let docToUpdate of docsToUpdate) {
            await this.datastore.update(docToUpdate as Document, username, undefined)
        }
    }


    private async getExistingConnectedDocs(documents: Array<Document>) {

        const connectedDocuments: Array<Document> = [];
        for (let id of this.getUniqueConnectedDocumentsIds(documents,
            this.projectConfiguration.getAllRelationDefinitions().map(to('name')))) {

            try {
                connectedDocuments.push(await this.datastore.get(id as string));
            } catch (_) {
                // this can be either due to deletion order, for example when
                // deleting multiple docs recordedIn some other, but related to one another
                // or it can be due to 'really' missing documents. missing documents mean
                // an inconsistent database state, which can for example result
                // of docs not yet replicated
                console.warn('connected document not found', id);
            }
        }
        return connectedDocuments;
    }


    private getUniqueConnectedDocumentsIds(documents: Array<Document>, allowedRelations: string[]) {

        const getAllRelationTargetsForDoc = (doc: Document) =>
            Relations.getAllTargets(doc.resource.relations, allowedRelations);

        return subtract
            (documents.map(toResourceId))
            (flatMap<any>(getAllRelationTargetsForDoc)(documents));
    }
}