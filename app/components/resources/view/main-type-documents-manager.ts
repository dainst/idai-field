import {Document} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {Query} from 'idai-components-2/datastore';
import {ViewManager} from './view-manager';
import {IdaiFieldDocumentReadDatastore} from "../../../core/datastore/idai-field-document-read-datastore";

/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
export class MainTypeDocumentsManager {

    private documents: Array<IdaiFieldDocument>;
    private selectedDocument: IdaiFieldDocument|undefined;

    constructor(
        private datastore: IdaiFieldDocumentReadDatastore,
        private viewManager: ViewManager
    ) {}


    public getDocuments() {

        return this.documents;
    }


    public getSelectedDocument() {

        return this.selectedDocument;
    }


    public async populate(): Promise<any> {

        if (!this.viewManager.getViewName()) return Promise.resolve();

        this.documents = await this.fetchDocuments(
            MainTypeDocumentsManager.makeMainTypeQuery(this.viewManager.getViewType()));;

        if (this.documents.length == 0) {
            this.selectedDocument = undefined;
            return;
        }
        return this.restoreLastSelectedOperationTypeDocument();
    }


    public select(document: IdaiFieldDocument) {

        this.selectedDocument = document;
        this.viewManager.setLastSelectedOperationTypeDocumentId(this.selectedDocument.resource.id);
    }


    /**
     * @returns {boolean} true if list needs to be reloaded afterwards
     */
    public selectLinkedOperationTypeDocumentForSelectedDocument(selectedDocument: Document): boolean {

        if (!this.documents || this.documents.length == 0) return false;

        let operationTypeDocument = MainTypeDocumentsManager.getMainTypeDocumentForDocument(
            selectedDocument, this.documents);

        if (operationTypeDocument && operationTypeDocument != this.selectedDocument) {
            this.selectedDocument = operationTypeDocument;
            return true;
        }

        return false;
    }


    public isRecordedInSelectedOperationTypeDocument(document: Document|undefined): boolean {

        if (document) return false;
        if (!this.selectedDocument) return false;

        const operationTypeDocumentForDocument
            = MainTypeDocumentsManager.getMainTypeDocumentForDocument(document, this.documents);

        if (!operationTypeDocumentForDocument) {
            console.error('Could not find main type document for selected document', document);
            return false;
        }

        return (operationTypeDocumentForDocument.resource.id != this.selectedDocument.resource.id);
    }


    private fetchDocuments(query: Query): Promise<any> {

        return this.datastore.find(query as any)
            .catch(errWithParams => MainTypeDocumentsManager.handleFindErr(errWithParams, query))
            .then(documents => {
                return documents;
            });
    }


    private restoreLastSelectedOperationTypeDocument(): Promise<any> {

        const selectFirstOperationTypeDocumentFromList = () => {
            if (this.documents && this.documents.length > 0) {
                this.selectedDocument = this.documents[0];
            } else {
                console.warn("cannot set selectedMainTypeDocument because mainTypeDocuments is empty")
            }
        };

        const mainTypeDocumentId = this.viewManager.getLastSelectedOperationTypeDocumentId();
        if (!mainTypeDocumentId) {
            selectFirstOperationTypeDocumentFromList();
            return Promise.resolve();
        } else {
            return this.datastore.get(mainTypeDocumentId)
                .then(document => this.selectedDocument =
                    document as IdaiFieldDocument)
                .catch(() => {
                    this.viewManager.removeActiveLayersIds(mainTypeDocumentId);
                    this.viewManager.setLastSelectedOperationTypeDocumentId(undefined);
                    selectFirstOperationTypeDocumentFromList();
                    return Promise.resolve();
                })
        }
    }


    private static getMainTypeDocumentForDocument(document: Document|undefined,
                                                  mainTypeDocuments: Document[]): IdaiFieldDocument|undefined {

        if (!mainTypeDocuments) return undefined;

        if (!document) return undefined;
        if (!document.resource.relations['isRecordedIn']) return undefined;

        for (let documentId of document.resource.relations['isRecordedIn']) {
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