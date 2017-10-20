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
 * Manages an overview of operation type resources
 * and different views for each operation type.
 *
 * In the overview the document list contains the operation type resources.
 * In the operation type views the list contains resources recorded in
 * one selected operation type resource.
 *
 * Apart from that, each view behaves the same in that the document list
 * can get filteres etc.
 *
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


    public isInOverview() {

        return this.viewManager.getView() &&
            this.viewManager.getView().mainType == 'Project';
    }

    
    public getViewName() {

        if (!this.viewManager.getView()) return;
        return this.viewManager.getView().name;
    }


    /**
     * @returns the main type of the currently selected view.
     * This is either 'Project' or one of the operation types names.
     */
    public getMainType(): string {

        if (!this.viewManager.getView()) return undefined;
        return this.viewManager.getView().mainType;
    }


    public getOperationTypeDocumentLabel(document) {

        if (this.isInOverview()) throw "calling getOperationTypeDocumentLabel is forbidden when isInOverview";
        return this.viewManager.getOperationTypeDocumentLabel(document);
    }


    public getOperationTypeLabel() {

        if (this.isInOverview()) throw "calling getOperationTypeLabel is forbidden when isInOverview";
        return this.viewManager.getMainTypeLabel();
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
     * Sets the this.documentsManager.selectedDocument
     * and if necessary, also
     * a) selects the operation type document,
     * this.documntsManager.selectedDocument is recorded in, accordingly and
     * b) invalidates query settings in order to make sure
     * this.documentsManager.selectedDocument is part of the search hits of the document list.
     *
     * @param document exits immediately if this is
     *   a) the same as this.documentsManager.selectedDocument or
     *   b) the same as this.mainTypeManager.selectedMainTypeDocument or
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


    public selectOperationTypeDocument(mainTypeDoc) {
        // TODO add guard: do nothing (or better: throw exception) when isInOverview

        return this.operationTypeDocumentsManager.select(mainTypeDoc);
    }


    public populateProjectDocument(): Promise<any> {

        return this.datastore.get(this.settingsService.getSelectedProject())
            .then(document => this.projectDocument = document as IdaiFieldDocument)
            .catch(err => Promise.reject(
                [M.DATASTORE_NOT_FOUND] // TODO do not return a key of M but instead some errWithParams
            ));
    }


    public isSelectedDocumentRecordedInSelectedOperationTypeDocument(): boolean {

        if (!this.documentsManager.getSelectedDocument()) return false;

        return this.operationTypeDocumentsManager.isRecordedInSelectedOperationTypeDocument(
            this.documentsManager.getSelectedDocument()
        );
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

        // TODO do nothing if if isInOverview
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