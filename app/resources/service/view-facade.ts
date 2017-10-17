import {Injectable} from '@angular/core';
import {MainTypeManager} from './main-type-manager';
import {ViewManager} from './view-manager';
import {DocumentsManager} from './documents-manager';
import {Document} from 'idai-components-2/core';

@Injectable()
/**
 *
 */
export class ViewFacade {

    constructor(
        private documentsManager: DocumentsManager,
        private viewManager: ViewManager,
        private mainTypeManager: MainTypeManager
    ) { }

    public init() {

        return this.mainTypeManager.init();
    }

    public getView() {

        return this.viewManager.getView();
    }

    public getMainTypeDocumentLabel(document) {

        return this.viewManager.getMainTypeDocumentLabel(document);
    }

    public getMainTypeLabel() {

        return this.viewManager.getMainTypeLabel();
    }

    public deselect() {

        return this.documentsManager.deselect();
    }

    public getMode() {

        return this.viewManager.getMode();
    }

    public getQuery() {

        return this.documentsManager.getQuery();
    }

    public getProjectDocument() {

        return this.documentsManager.projectDocument;
    }

    public handleMainTypeDocumentOnDeleted(document: Document) {

        this.viewManager.removeActiveLayersIds(this.mainTypeManager.selectedMainTypeDocument.resource.id);
        this.viewManager.setLastSelectedMainTypeDocumentId(undefined);
        return this.populateMainTypeDocuments(document);
    }

    public getSelectedMainTypeDocument() {

        return this.mainTypeManager.selectedMainTypeDocument;
    }

    public getMainTypeDocuments() {

        return this.mainTypeManager.mainTypeDocuments;
    }

    public getFilterTypes() {

        return this.viewManager.getFilterTypes();
    }

    public getQueryString() {

        return this.viewManager.getQueryString();
    }

    public setMode(mode) {

        this.viewManager.setMode(mode);
    }

    public setSelectedDocumentById(id) {

        return this.documentsManager.setSelectedById(id);
    }

    public getSelectedDocument() {

        return this.documentsManager.selected();
    }

    public setSelectedDocument(document) {

        return this.documentsManager.setSelected(document);
    }

    public getDocuments() {

        return this.documentsManager.documents;
    }

    public setQueryString(q) {

        return this.documentsManager.setQueryString(q);
    }

    public setQueryTypes(types) {

        return this.documentsManager.setQueryTypes(types);
    }

    public selectMainTypeDocument(mainTypeDoc, selectedDocument, cb) {

        return this.mainTypeManager.selectMainTypeDocument(
            mainTypeDoc, selectedDocument, cb);
    }

    public populateProjectDocument() {

        return this.documentsManager.populateProjectDocument();
    }

    public populateDocumentList() {

        return this.documentsManager.populateDocumentList();
    }

    public populateMainTypeDocuments(selectedDocument) {

        return this.mainTypeManager.populateMainTypeDocuments(selectedDocument);
    }
}