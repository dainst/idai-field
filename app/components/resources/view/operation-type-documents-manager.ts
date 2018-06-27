import {IdaiFieldDocument} from 'idai-components-2/field';
import {Query} from 'idai-components-2/core';
import {IdaiFieldDocumentReadDatastore} from '../../../core/datastore/field/idai-field-document-read-datastore';
import {ResourcesStateManager} from './resources-state-manager';

/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
export class OperationTypeDocumentsManager {

    private documents: Array<IdaiFieldDocument>;


    constructor(
        private datastore: IdaiFieldDocumentReadDatastore,
        private resourcesStateManager: ResourcesStateManager
    ) {}

    
    public getDocuments = () => this.documents;


    public async populate(): Promise<void> {

        this.documents = await this.fetchDocuments(
            OperationTypeDocumentsManager.makeMainTypeQuery(
                this.resourcesStateManager.getViewType() as string // cast ok because we populate only when not in overview
            ));

        if (this.documents.length === 0) return this.resourcesStateManager.setMainTypeDocument(undefined);

        await this.restoreLastSelectedOperationTypeDocument();
    }


    public selectLinkedOperationTypeDocumentForSelectedDocument(
        selectedDocument: IdaiFieldDocument|undefined) {

        if (!this.documents || this.documents.length === 0) return;

        const operationTypeDocument = OperationTypeDocumentsManager.getMainTypeDocumentForDocument(
            selectedDocument, this.documents);

        if (operationTypeDocument && operationTypeDocument.resource.id !== this.resourcesStateManager.getMainTypeDocumentResourceId()) {
            this.resourcesStateManager.setMainTypeDocument(operationTypeDocument.resource.id);
        }
    }


    private async fetchDocuments(query: Query): Promise<any> {

        try {
            const result = await this.datastore.find(query as any);
            if (result) return result.documents;
        } catch (errWithParams) {
            OperationTypeDocumentsManager.handleFindErr(errWithParams, query);
        }
    }


    private selectFirstOperationTypeDocumentFromList() {

        if (this.documents && this.documents.length > 0) {
            this.resourcesStateManager.setMainTypeDocument(this.documents[0].resource.id);
        } else {
            console.warn('cannot set selectedMainTypeDocument because mainTypeDocuments is empty')
        }
    };


    private async restoreLastSelectedOperationTypeDocument(): Promise<void> {

        const mainTypeDocumentResourceId = this.resourcesStateManager.getMainTypeDocumentResourceId();
        if (!mainTypeDocumentResourceId) {
            this.selectFirstOperationTypeDocumentFromList();
        } else {
            try {
                const document = await this.datastore.get(mainTypeDocumentResourceId);
                this.resourcesStateManager.setMainTypeDocument(document.resource.id);
            } catch(e) {
                this.resourcesStateManager.removeActiveLayersIds();
                this.selectFirstOperationTypeDocumentFromList();
            }
        }
    }


    private static getMainTypeDocumentForDocument(document: IdaiFieldDocument|undefined,
                                                  mainTypeDocuments: IdaiFieldDocument[]): IdaiFieldDocument|undefined {

        if (!mainTypeDocuments) return undefined;
        if (!document) return undefined;

        for (let documentId of document.resource.relations.isRecordedIn) {
            for (let mainTypeDocument of mainTypeDocuments) {
                if (mainTypeDocument.resource.id == documentId) return mainTypeDocument as IdaiFieldDocument;
            }
        }
    }


    private static handleFindErr(errWithParams: Array<string>, query: Query) {

        console.error('Error with find. Query:', query);
        if (errWithParams.length == 2) console.error('Error with find. Cause:', errWithParams[1]);
    }


    private static makeMainTypeQuery(mainType: string): Query {

        return { types: [mainType] };
    }
}