import {flatMap, subtract, to} from 'tsfun';
import {Document, Relations, toResourceId} from 'idai-components-2';
import {DocumentDatastore} from '../datastore/document-datastore';
import {ProjectConfiguration} from '../configuration/project-configuration';
import {makeInverseRelationsMap} from '../configuration/project-configuration-helper';
import {determineDocsToUpdate} from './determine-docs-to-update';


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

    private inverseRelationsMap: {[_: string]: string};

    constructor(
        private datastore: DocumentDatastore,
        private projectConfiguration: ProjectConfiguration) {

        this.inverseRelationsMap = makeInverseRelationsMap(projectConfiguration.getAllRelationDefinitions());
    }


    public async update(document: Document, otherVersions: Array<Document>, username: string): Promise<void> {

        const connectedDocs = await this.getExistingConnectedDocs([document].concat(otherVersions));

        const docsToUpdate = determineDocsToUpdate(
            document,
            connectedDocs,
            this.inverseRelationsMap,
            true
        );

        await this.updateDocs(docsToUpdate, username);
    }


    public async remove(document: Document, username: string): Promise<void> {

        const connectedDocs = await this.getExistingConnectedDocs([document]);

        const docsToUpdate = determineDocsToUpdate(
            document,
            connectedDocs,
            this.inverseRelationsMap,
            false
        );

        await this.updateDocs(docsToUpdate, username);
    }


    private async updateDocs(docsToUpdate: Array<Document>, username: string) {

        // Note that this does not update a document for being target of isRecordedIn
        for (let docToUpdate of docsToUpdate) {
            await this.datastore.update(docToUpdate, username, undefined);
        }
    }


    private async getExistingConnectedDocs(documents: Array<Document>) {

        const uniqueConnectedDocIds = ConnectedDocsWriter.getUniqueConnectedDocumentsIds(
            documents,
            this.projectConfiguration
                .getAllRelationDefinitions()
                .map(to('name'))
        );

        const connectedDocuments: Array<Document> = [];
        for (let id of uniqueConnectedDocIds) {

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


    private static getUniqueConnectedDocumentsIds(documents: Array<Document>, allowedRelations: string[]) {

        const getAllRelationTargetsForDoc = (doc: Document) =>
            Relations.getAllTargets(doc.resource.relations, allowedRelations);

        return subtract
            (documents.map(toResourceId))
            (flatMap<any>(getAllRelationTargetsForDoc)(documents));
    }
}