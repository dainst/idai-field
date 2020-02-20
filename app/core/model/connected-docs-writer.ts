import {flatMap, subtract, to, flow} from 'tsfun';
import {Document, Relations, toResourceId} from 'idai-components-2';
import {DocumentDatastore} from '../datastore/document-datastore';
import {ProjectConfiguration} from '../configuration/project-configuration';
import {InverseRelationsMap, makeInverseRelationsMap} from '../configuration/project-configuration-helper';
import {determineDocsToUpdate} from './determine-docs-to-update';
import {Name} from '../constants';

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
        private datastore: DocumentDatastore,
        private projectConfiguration: ProjectConfiguration) {

        this.inverseRelationsMap = makeInverseRelationsMap(projectConfiguration.getAllRelationDefinitions());
    }


    public async update(document: Document, otherVersions: Array<Document>, user: Name) {

        const connectedDocs = await this.getExistingConnectedDocs([document].concat(otherVersions));

        const docsToUpdate = determineDocsToUpdate(
            document,
            connectedDocs,
            this.inverseRelationsMap,
            true
        );

        await this.updateDocs(docsToUpdate, user);
    }


    public async remove(document: Document, user: Name) {

        const connectedDocs = await this.getExistingConnectedDocs([document]);

        const docsToUpdate = determineDocsToUpdate(
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


    private async getExistingConnectedDocs(documents: Array<Document>) {

        const uniqueConnectedDocIds = ConnectedDocsWriter.getUniqueConnectedDocumentsIds(
            documents,
            this.projectConfiguration
                .getAllRelationDefinitions()
                .map(to(NAME))
        );

        const connectedDocuments: Array<Document> = [];
        for (let id of uniqueConnectedDocIds) {

            try {
                connectedDocuments.push(await this.datastore.get(id));
            } catch {
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

        const getAllRelationTargetsForDoc = (doc: Document): any /* TODO type flatMap properly from A->B to get rid of any cast */=>
            Relations.getAllTargets(doc.resource.relations, allowedRelations);

        return flow(
            documents,
            flatMap(getAllRelationTargetsForDoc),
            subtract(documents.map(toResourceId)));
    }
}