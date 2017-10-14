import {DocumentChange, Query, Datastore} from 'idai-components-2/datastore';
import {Action, Document} from 'idai-components-2/core';
import {Injectable} from '@angular/core';
import {MainTypeManager} from "./main-type-manager";
import {ViewManager} from './view-manager';
import {Loading} from "../../widgets/loading";
import {Messages} from 'idai-components-2/messages';
import {M} from "../../m";
import {SettingsService} from '../../settings/settings-service';

@Injectable()
/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
export class DocumentsManager {

    public documents: Array<Document>;

    public newDocumentsFromRemote: Array<Document> = [];


    constructor(
        private mainTypeManager: MainTypeManager,
        private datastore: Datastore,
        private viewManager: ViewManager,
        private loading: Loading,
        private messages: Messages,
        private settingsService: SettingsService
    ) {

    }


    public handleChange(
        documentChange: DocumentChange,
        selectedDocument: Document) {

        if (documentChange.type == 'deleted') {
            console.debug('unhandled deleted document');
            return;
        }

        let changedDocument: Document = documentChange.document;

        if (!this.documents || !this.isRemoteChange(changedDocument)) return;
        if (DocumentsManager.isExistingDoc(changedDocument, this.documents)) return;

        if (changedDocument.resource.type == this.viewManager.getView().mainType) {
            return this.mainTypeManager.
            populateMainTypeDocuments(selectedDocument);
        }

        let oldDocuments = this.documents;
        this.populateDocumentList().then(() => {
            for (let doc of this.documents) {
                if (oldDocuments.indexOf(doc) == -1 && this.isRemoteChange(doc)) {
                    this.newDocumentsFromRemote.push(doc);
                }
            }
        });
    }


    /**
     * Populates the document list with all documents from
     * the datastore which match a <code>query</code>
     */
    public populateDocumentList() {

        this.newDocumentsFromRemote = [];

        if (!this.mainTypeManager.selectedMainTypeDocument) {
            this.documents = [];
            return Promise.resolve();
        }

        return this.fetchDocuments(DocumentsManager.makeDocsQuery(
            {q: this.viewManager.getQueryString(), types: this.viewManager.getQueryTypes()},
            this.mainTypeManager.selectedMainTypeDocument.resource.id))
            .then(documents => this.documents = documents);
    }


    public isRemoteChange(changedDocument: Document): boolean {

        const latestAction: Action =
            (changedDocument.modified && changedDocument.modified.length > 0)
                ? changedDocument.modified[changedDocument.modified.length - 1]
                : changedDocument.created;

        return latestAction && latestAction.user != this.settingsService.getUsername();
    }


    private static isExistingDoc(changedDocument: Document, documents: Array<Document>): boolean {

        for (let doc of documents) {
            if (!doc.resource || !changedDocument.resource) continue;
            if (!doc.resource.id || !changedDocument.resource.id) continue;
            if (doc.resource.id == changedDocument.resource.id) return true;
        }
    }


    private static makeDocsQuery(query: Query, mainTypeDocumentResourceId: string): Query {

        const clonedQuery = JSON.parse(JSON.stringify(query));
        clonedQuery.constraints = { 'resource.relations.isRecordedIn': mainTypeDocumentResourceId };
        return clonedQuery;
    }


    private fetchDocuments(query: Query): Promise<any> {

        this.loading.start();
        return this.datastore.find(query)
            .catch(errWithParams => this.handleFindErr(errWithParams, query))
            .then(documents => {
                this.loading.stop(); return documents;
            });
    }


    private handleFindErr(errWithParams: Array<string>, query: Query) {

        console.error('Error with find. Query:', query);
        if (errWithParams.length == 2) console.error('Error with find. Cause:', errWithParams[1]);
        this.messages.add([M.ALL_FIND_ERROR]);
    }


    public removeEmptyDocuments() {

        if (!this.documents) return;

        for (let document of this.documents) {
            if (!document.resource.id) this.remove(document);
        }
    }


    public remove(document: Document) {

        this.documents.splice(this.documents.indexOf(document), 1);
    }
}