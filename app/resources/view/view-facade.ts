import {Injectable} from '@angular/core';
import {Document} from 'idai-components-2/core';
import {ProjectConfiguration} from 'idai-components-2/configuration';
import {Datastore} from 'idai-components-2/datastore';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {OperationTypeDocumentsManager} from './operation-type-documents-manager';
import {ViewManager} from './view-manager';
import {DocumentsManager} from './documents-manager';
import {ResourcesState} from './resources-state';
import {ViewUtility} from '../../common/view-utility';
import {Loading} from '../../widgets/loading';
import {SettingsService} from '../../settings/settings-service';
import {StateSerializer} from '../../common/state-serializer';
import {M} from '../../m';

@Injectable()
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class ViewFacade {


    private viewManager: ViewManager;
    private operationTypeDocumentsManager: OperationTypeDocumentsManager;
    private documentsManager: DocumentsManager;

    private projectDocument: IdaiFieldDocument;


    constructor(
        private projectConfiguration: ProjectConfiguration,
        private datastore: Datastore,
        private loading: Loading,
        private settingsService: SettingsService,
        private stateSerializer: StateSerializer
    ) {
        this.viewManager = new ViewManager(
            new ViewUtility(
                projectConfiguration,
                datastore
            ),
            projectConfiguration,
            new ResourcesState(
                stateSerializer
            )
        );
        this.operationTypeDocumentsManager = new OperationTypeDocumentsManager(
            datastore,
            this.viewManager
        );
        this.documentsManager = new DocumentsManager(
            datastore,
            loading,
            settingsService,
            this.viewManager,
            this.operationTypeDocumentsManager
        );
    }

    
    public getView() {

        return this.viewManager.getView();
    }


    public getOperationTypeDocumentLabel(document) {

        return this.viewManager.getOperationTypeDocumentLabel(document);
    }


    public getOperationTypeLabel() {

        return this.viewManager.getOperationTypeLabel();
    }


    public deselect() {

        return this.documentsManager.deselect();
    }


    public getMode() {

        return this.viewManager.getMode();
    }


    public getQuery() {

        return {
            q: this.viewManager.getQueryString(),
            types: this.viewManager.getQueryTypes()
        }
    }


    public getProjectDocument() {

        return this.projectDocument;
    }


    public handleMainTypeDocumentOnDeleted(document: Document) {

        this.viewManager.removeActiveLayersIds(this.operationTypeDocumentsManager.getSelectedDocument().resource.id);
        this.viewManager.setLastSelectedOperationTypeDocumentId(undefined);
        return this.populateOperationTypeDocuments();
    }


    public setActiveLayersIds(mainTypeDocumentResourceId, activeLayersIds) {

        return this.viewManager.setActiveLayersIds(mainTypeDocumentResourceId, activeLayersIds);
    }


    public getActiveLayersIds(mainTypeDocumentResourceId) {

        return this.viewManager.getActiveLayersIds(mainTypeDocumentResourceId);
    }


    public getSelectedOperationTypeDocument() {

        return this.operationTypeDocumentsManager.getSelectedDocument();
    }


    public getOperationTypeDocuments() {

        return this.operationTypeDocumentsManager.getDocuments();
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


    public isNewDocumentFromRemote(document: Document) {

        return this.documentsManager.isNewDocumentFromRemote(document);
    }


    public remove(document: Document) {

        return this.documentsManager.remove(document);
    }


    public getSelectedDocument() {

        return this.documentsManager.getSelectedDocument();
    }


    /**
     * Sets the this.selectedDocument
     * and if necessary, also
     * a) selects the operation type document,
     * this.selectedDocument is recorded in, accordingly and
     * b) invalidates query settings in order to make sure
     * this.selectedDocument is part of the search hits of the document list
     * on the left hand side in the map view.
     *
     * @param documentToSelect exits immediately if this is
     *   a) this.selectedDocument or
     *   b) this.mainTypeManager.selectedMainTypeDocument or
     *   c) undefined
     * @returns {Document}
     */
    public setSelectedDocument(document) {

        return this.documentsManager.setSelected(document);
    }


    public getDocuments() {

        return this.documentsManager.getDocuments();
    }


    public setQueryString(q) { // TODO make unique access points: setQuery, getQuery, get rid of the other methods

        return this.documentsManager.setQueryString(q);
    }


    public setQueryTypes(types) {

        return this.documentsManager.setQueryTypes(types);
    }


    public getCurrentFilterType() {

        return this.viewManager.getCurrentFilterType();
    }


    public selectMainTypeDocument(mainTypeDoc) {

        return this.operationTypeDocumentsManager.select(mainTypeDoc);
    }


    public populateProjectDocument(): Promise<any> {

        return this.datastore.get(this.settingsService.getSelectedProject())
            .then(document => this.projectDocument = document as IdaiFieldDocument)
            .catch(err => Promise.reject(
                [M.DATASTORE_NOT_FOUND] // TODO do not return a key of M but instead some errWithParams
            ));
    }


    public isRecordedInSelectedMainTypeDocument(document: Document): boolean { // TODO remove param and use selecteDocument

        return this.operationTypeDocumentsManager.isRecordedInSelectedOperationTypeDocument(document);
    }


    public populateDocumentList() {

        return this.documentsManager.populateDocumentList();
    }


    /**
     * Based on the current view, populates the operation type documents and also
     * sets the selectedMainTypeDocument to either
     *   a) the last selected one for that view if any or
     *   b) the first element of the operation type documents it is not set
     *      and operation type documents length > 1
     *
     * @returns {Promise<any>}
     */
    public populateOperationTypeDocuments() {

        return this.operationTypeDocumentsManager.populate();
    }


    public setupView(viewName: string, defaultMode: string) {

        return this.viewManager.setupView(viewName, defaultMode);
    }


    public getViewNameForDocument(document: Document): Promise <string> {

        return this.viewManager.getViewNameForDocument(document);
    }


    public getOperationTypeHomeViewName(operationTypeName: string): string {

        return this.viewManager.getOperationTypeHomeViewName(operationTypeName);
    }
}