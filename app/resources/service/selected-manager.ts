import {Document} from 'idai-components-2/core';
import {IdaiFieldDocument} from "idai-components-2/idai-field-model";
import {ResourcesComponent} from "../resources.component";
import {Injectable} from '@angular/core';
import {ViewManager} from "./view-manager";
import {Datastore} from "idai-components-2/datastore";
import {Query} from 'idai-components-2/datastore';

@Injectable()
/**
 *
 */
export class SelectedManager {

    public selectedDocument: Document;
    public mainTypeDocuments: Array<IdaiFieldDocument>;
    public selectedMainTypeDocument: IdaiFieldDocument;

    constructor(
        private viewManager: ViewManager,
        private datastore: Datastore
    ) {

    }


    public init() {

        this.selectedDocument = undefined;
        this.selectedMainTypeDocument = undefined;
        this.mainTypeDocuments = undefined;
    }

    public setSelectedMainTypeDocument(): Promise<any> {

        if (this.mainTypeDocuments.length == 0) {
            this.selectedMainTypeDocument = undefined;
            return Promise.resolve();
        }

        if (this.selectedDocument) {
            this.selectedMainTypeDocument =
                SelectedManager.getMainTypeDocumentForDocument(
                    this.selectedDocument, this.mainTypeDocuments
                );
            if (!this.selectedMainTypeDocument) this.selectedMainTypeDocument =
                this.mainTypeDocuments[0];
            return Promise.resolve();
        }

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


    public populateMainTypeDocuments(): Promise<any> {

        if (!this.viewManager.getView()) return Promise.resolve();

        return this.fetchDocuments(
            ResourcesComponent.makeMainTypeQuery(this.viewManager.getView().mainType))
            .then(documents => {
                this.mainTypeDocuments = documents as Array<IdaiFieldDocument>;
                return this.setSelectedMainTypeDocument();
            });
    }


    public insertRecordsRelation() {

        if (this.selectedMainTypeDocument.resource.type != 'Project') return;

        this.datastore.find({

            constraints: {
                'resource.relations.isRecordedIn' :
                this.selectedDocument.resource.id
            }

        }).then(documents => {

            this.selectedDocument.resource.relations['records'] = [];
            for (let doc of documents) {
                this.selectedDocument.resource.relations['records'].push(
                    doc.resource.id
                );
            }
        });
    }


    private fetchDocuments(query: Query): Promise<any> {

        return this.datastore.find(query)
            .catch(errWithParams => SelectedManager.handleFindErr(errWithParams, query))
            .then(documents => {
                return documents;
            });
    }


    public selectMainTypeDocument(document: IdaiFieldDocument, cb) {

        this.selectedMainTypeDocument = document;
        this.viewManager.setLastSelectedMainTypeDocumentId(this.selectedMainTypeDocument.resource.id);

        if (this.selectedDocument &&
            SelectedManager.getMainTypeDocumentForDocument(
                this.selectedDocument, this.mainTypeDocuments) != this.selectedMainTypeDocument) {

            cb();
        }
    }


    /**
     * @returns {boolean} true if list needs to be reloaded afterwards
     */
    public selectLinkedMainTypeDocumentForSelectedDocument(): boolean {

        if (!this.mainTypeDocuments || this.mainTypeDocuments.length == 0) return false;

        let mainTypeDocument = SelectedManager.getMainTypeDocumentForDocument(
            this.selectedDocument, this.mainTypeDocuments);

        if (mainTypeDocument != this.selectedMainTypeDocument) {
            this.selectedMainTypeDocument = mainTypeDocument;
            return true;
        }

        return false;
    }


    /**
     * @returns {boolean} true if list needs to be reloaded afterwards
     */
    public invalidateQuerySettingsIfNecessary(): boolean {

        const typesInvalidated = this.invalidateTypesIfNecessary();
        const queryStringInvalidated = this.invalidateQueryStringIfNecessary();

        return typesInvalidated || queryStringInvalidated;
    }


    /**
     * @returns {boolean} true if list needs to be reloaded afterwards
     */
    private invalidateTypesIfNecessary(): boolean {

        if (this.viewManager.isSelectedDocumentTypeInTypeFilters(this.selectedDocument)) return false;

        this.viewManager.setFilterTypes([]);

        return true;
    }


    /**
     * @returns {boolean} true if list needs to be reloaded afterwards
     */
    private invalidateQueryStringIfNecessary(): boolean {

        if (this.viewManager.isSelectedDocumentMatchedByQueryString(this.selectedDocument)) return false;

        this.viewManager.setQueryString('');

        return true;
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
}