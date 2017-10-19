import {Document} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {Query, ReadDatastore} from 'idai-components-2/datastore';
import {ViewManager} from './view-manager';

/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
export class MainTypeManager {

    public mainTypeDocuments: Array<IdaiFieldDocument>; // TODO make private
    public selectedMainTypeDocument: IdaiFieldDocument; // TODO make private

    constructor(
        private datastore: ReadDatastore,
        private viewManager: ViewManager
    ) {}


    public init() {

        this.selectedMainTypeDocument = undefined;
        this.mainTypeDocuments = undefined;
    }


    public populateMainTypeDocuments(): Promise<any> {

        if (!this.viewManager.getView()) return Promise.resolve();

        return this.fetchDocuments(
            MainTypeManager.makeMainTypeQuery(this.viewManager.getView().mainType))
            .then(documents => {
                this.mainTypeDocuments = documents as Array<IdaiFieldDocument>;
                if (this.mainTypeDocuments.length == 0) {
                    this.selectedMainTypeDocument = undefined;
                    return;
                }
                return this.restoreLastSelectedMainTypeDocument();
            });
    }


    public selectMainTypeDocument(mainTypeDoc: IdaiFieldDocument) {

        this.selectedMainTypeDocument = mainTypeDoc;
        this.viewManager.setLastSelectedMainTypeDocumentId(this.selectedMainTypeDocument.resource.id);
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


    public isRecordedInSelectedMainTypeDocument(document: Document): boolean {

        if (document) return false;
        if (!this.selectedMainTypeDocument) return false;

        const mainTypeDocumentForDocument
            = MainTypeManager.getMainTypeDocumentForDocument(document, this.mainTypeDocuments);

        if (!mainTypeDocumentForDocument) {
            console.error('Could not find main type document for selected document', document);
            return false;
        }

        return (mainTypeDocumentForDocument.resource.id != this.selectedMainTypeDocument.resource.id);
    }


    private fetchDocuments(query: Query): Promise<any> {

        return this.datastore.find(query)
            .catch(errWithParams => MainTypeManager.handleFindErr(errWithParams, query))
            .then(documents => {
                return documents;
            });
    }


    private restoreLastSelectedMainTypeDocument(): Promise<any> {

        const selectFirstMainTypeDocumentFromList = () => {
            if (this.mainTypeDocuments && this.mainTypeDocuments.length > 0) {
                this.selectedMainTypeDocument = this.mainTypeDocuments[0];
            } else {
                console.warn("cannot set selectedMainTypeDocument because mainTypeDocuments is empty")
            }
        };

        const mainTypeDocumentId = this.viewManager.getLastSelectedMainTypeDocumentId();
        if (!mainTypeDocumentId) {
            selectFirstMainTypeDocumentFromList();
            return Promise.resolve();
        } else {
            return this.datastore.get(mainTypeDocumentId)
                .then(document => this.selectedMainTypeDocument =
                    document as IdaiFieldDocument)
                .catch(() => {
                    this.viewManager.removeActiveLayersIds(mainTypeDocumentId);
                    this.viewManager.setLastSelectedMainTypeDocumentId(undefined);
                    selectFirstMainTypeDocumentFromList();
                    return Promise.resolve();
                })
        }
    }


    private static getMainTypeDocumentForDocument(document: Document, mainTypeDocuments): IdaiFieldDocument {

        if (!mainTypeDocuments) return undefined;

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