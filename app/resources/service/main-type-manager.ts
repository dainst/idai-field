import {Injectable} from '@angular/core';
import {Document} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {Datastore, Query} from 'idai-components-2/datastore';
import {ViewManager} from './view-manager';

/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
export class MainTypeManager {

    public mainTypeDocuments: Array<IdaiFieldDocument>;
    public selectedMainTypeDocument: IdaiFieldDocument;

    constructor(
        private datastore: Datastore,
        private viewManager: ViewManager
    ) {}


    public init() {

        this.selectedMainTypeDocument = undefined;
        this.mainTypeDocuments = undefined;
    }


    public setSelectedMainTypeDocument(selectedDocument: IdaiFieldDocument): Promise<any> {

        if (this.mainTypeDocuments.length == 0) {
            this.selectedMainTypeDocument = undefined;
            return Promise.resolve();
        }
        if (!selectedDocument) return this.restoreLastSelectedMainTypeDocument();

        this.selectedMainTypeDocument =
            MainTypeManager.getMainTypeDocumentForDocument(
                selectedDocument, this.mainTypeDocuments
            );
        if (!this.selectedMainTypeDocument) this.selectedMainTypeDocument =
            this.mainTypeDocuments[0];
        return Promise.resolve();
    }


    // TODO Why is the document needed?
    public populateMainTypeDocuments(document: Document): Promise<any> {

        if (!this.viewManager.getView()) return Promise.resolve();

        return this.fetchDocuments(
            MainTypeManager.makeMainTypeQuery(this.viewManager.getView().mainType))
            .then(documents => {
                this.mainTypeDocuments = documents as Array<IdaiFieldDocument>;
                return this.setSelectedMainTypeDocument(document as IdaiFieldDocument);
            });
    }


    private fetchDocuments(query: Query): Promise<any> {

        return this.datastore.find(query)
            .catch(errWithParams => MainTypeManager.handleFindErr(errWithParams, query))
            .then(documents => {
                return documents;
            });
    }


    public selectMainTypeDocument(mainTypeDoc: IdaiFieldDocument, selectedDocument: Document, cb: Function) {

        this.selectedMainTypeDocument = mainTypeDoc;
        this.viewManager.setLastSelectedMainTypeDocumentId(this.selectedMainTypeDocument.resource.id);

        if (!selectedDocument || !this.selectedMainTypeDocument) return;

        const mainTypeDocumentForDocument
            = MainTypeManager.getMainTypeDocumentForDocument(selectedDocument, this.mainTypeDocuments);

        if (!mainTypeDocumentForDocument) {
            return console.error('Could not find main type document for selected document', selectedDocument);
        }

        if (mainTypeDocumentForDocument.resource.id != this.selectedMainTypeDocument.resource.id) cb();
    }


    /**
     * @returns {boolean} true if list needs to be reloaded afterwards
     */
    public selectLinkedMainTypeDocumentForSelectedDocument(selectedDocument: Document): boolean {

        if (!this.mainTypeDocuments || this.mainTypeDocuments.length == 0) return false;

        let mainTypeDocument = MainTypeManager.getMainTypeDocumentForDocument(
            selectedDocument, this.mainTypeDocuments);

        if (mainTypeDocument && mainTypeDocument != this.selectedMainTypeDocument) {
            this.selectedMainTypeDocument = mainTypeDocument;
            return true;
        }

        return false;
    }


    private restoreLastSelectedMainTypeDocument(): Promise<any> {

        const mainTypeDocumentId = this.viewManager.getLastSelectedMainTypeDocumentId();
        if (!mainTypeDocumentId) {
            this.selectedMainTypeDocument = this.mainTypeDocuments[0];
            return Promise.resolve();
        } else {
            return this.datastore.get(mainTypeDocumentId)
                .then(document => this.selectedMainTypeDocument =
                    document as IdaiFieldDocument)
                .catch(() => {
                    this.viewManager.removeActiveLayersIds(mainTypeDocumentId);
                    this.viewManager.setLastSelectedMainTypeDocumentId(undefined);
                    this.selectedMainTypeDocument = this.mainTypeDocuments[0];
                    return Promise.resolve();
                })
        }
    }


    private static getMainTypeDocumentForDocument(document: Document, mainTypeDocuments): IdaiFieldDocument {

        if (!document.resource.relations['isRecordedIn']) return undefined;

        for (let documentId of document.resource.relations['isRecordedIn']) {
            for (let mainTypeDocument of mainTypeDocuments) {
                if (mainTypeDocument.resource.id == documentId) return mainTypeDocument;
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