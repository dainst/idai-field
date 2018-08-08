import {Injectable} from '@angular/core';
import {Document, toResourceId, Relations,
    NewDocument, ProjectConfiguration} from 'idai-components-2/core';
import {ConnectedDocsResolution} from './connected-docs-resolution';
import {DocumentDatastore} from '../datastore/document-datastore';
import {subtract, flatMap, flow, filter, to, on, isNot, mapTo, includedIn} from 'tsfun';
import {TypeUtility} from '../model/type-utility';

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


    public async remove(document: Document,
                                 oldVersion: Document,
                                 username: string): Promise<void> {

        await this.updateWithConnections(
            document, oldVersion, [], true, username);
        await this.datastore.remove(document);
        return undefined;
    }


    public async update(document: Document,
                        oldVersion: Document,
                        revisionsToSquash: Array<Document>,
                        username: string) {

        const updated = await this.persistIt(document, username, mapTo('_rev', revisionsToSquash));

        await this.updateWithConnections(
            updated, oldVersion, revisionsToSquash, false, username);
        return updated as Document;
    }


    private async updateWithConnections(document: Document,
                                        oldVersion: Document,
                                        revisionsToSquash: Array<Document>,
                                        deletion: boolean,
                                        username: string): Promise<void> {

        const connectedDocs = await this.getExistingConnectedDocs(
            [document].concat([oldVersion]).concat(revisionsToSquash));

        const docsToUpdate = ConnectedDocsResolution.determineDocsToUpdate(
            this.projectConfiguration, document,
            connectedDocs, !deletion);

        // Note that this does not update a document for beeing target of isRecordedIn
        for (let docToUpdate of docsToUpdate) await this.persistIt(docToUpdate, username, []);
    }


    private async getExistingConnectedDocs(documents: Array<Document>) {

        const connectedDocuments: Array<Document> = [];
        for (let id of this.getUniqueConnectedDocumentsIds(documents,
            this.projectConfiguration.getAllRelationDefinitions().map(to('name')))) {

            try {
                connectedDocuments.push(await this.datastore.get(id));
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


    private persistIt(document: Document|NewDocument, username: string, squashRevisionIds: string[]): Promise<Document> {

        return document.resource.id
            ? this.datastore.update(
                document as Document,
                username,
                squashRevisionIds.length === 0 ? undefined : squashRevisionIds)
            : this.datastore.create(document, username);
    }
}