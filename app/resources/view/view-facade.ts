import {Injectable} from '@angular/core';
import {MainTypeManager} from './main-type-manager';
import {ViewManager} from './view-manager';
import {DocumentsManager} from './documents-manager';
import {Document} from 'idai-components-2/core';
import {ResourcesState} from './resources-state';
import {ViewUtility} from '../../common/view-utility';
import {Datastore} from "idai-components-2/datastore";
import {Loading} from '../../widgets/loading';
import {SettingsService} from "../../settings/settings-service";
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {M} from '../../m';
import {ProjectConfiguration} from 'idai-components-2/configuration';
import {StateSerializer} from '../../common/state-serializer';

@Injectable()
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class ViewFacade {


    private viewManager: ViewManager;
    private mainTypeManager: MainTypeManager;
    private documentsManager: DocumentsManager;

    private projectDocument: IdaiFieldDocument;


    constructor(
        private projectConfiguration: ProjectConfiguration,
        private datastore: Datastore,
        private loading: Loading,
        private settingsService: SettingsService
    ) {
        this.viewManager = new ViewManager(
            new ViewUtility(
                projectConfiguration,
                datastore
            ),
            projectConfiguration,
            new ResourcesState(
                new StateSerializer(settingsService) // TODO the fs inside might lead to problems in unit test. in that case use DI to get an instance as a constructor param here
            )
        );
        this.mainTypeManager = new MainTypeManager(
            datastore,
            this.viewManager
        );
        this.documentsManager = new DocumentsManager(
            datastore,
            loading,
            settingsService,
            this.viewManager,
            this.mainTypeManager
        );
    }

    
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

        return {
            q: this.viewManager.getQueryString(),
            types: this.viewManager.getQueryTypes()
        }
    }


    public getProjectDocument() {

        return this.projectDocument;
    }


    public handleMainTypeDocumentOnDeleted(document: Document) {

        this.viewManager.removeActiveLayersIds(this.mainTypeManager.selectedMainTypeDocument.resource.id);
        this.viewManager.setLastSelectedMainTypeDocumentId(undefined);
        return this.populateMainTypeDocuments(document);
    }


    public setActiveLayersIds(mainTypeDocumentResourceId, activeLayersIds) {

        return this.viewManager.setActiveLayersIds(mainTypeDocumentResourceId, activeLayersIds);
    }


    public getActiveLayersIds(mainTypeDocumentResourceId) {

        return this.viewManager.getActiveLayersIds(mainTypeDocumentResourceId);
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


    public setQueryString(q) {

        return this.documentsManager.setQueryString(q);
    }


    public setQueryTypes(types) {

        return this.documentsManager.setQueryTypes(types);
    }


    public getCurrentFilterType() {

        return this.viewManager.getCurrentFilterType();
    }


    public selectMainTypeDocument(mainTypeDoc, selectedDocument, cb) {

        return this.mainTypeManager.selectMainTypeDocument(
            mainTypeDoc, selectedDocument, cb);
    }


    public populateProjectDocument(): Promise<any> {

        return this.datastore.get(this.settingsService.getSelectedProject())
            .then(document => this.projectDocument = document as IdaiFieldDocument)
            .catch(err => Promise.reject(
                [M.DATASTORE_NOT_FOUND] // TODO do not return a key of M but instead some errWithParams
            ));
    }


    public populateDocumentList() {

        return this.documentsManager.populateDocumentList();
    }


    public populateMainTypeDocuments(selectedDocument) {

        return this.mainTypeManager.populateMainTypeDocuments(selectedDocument);
    }


    public setupViewFrom(params) {

        return this.viewManager.setupViewFrom(params);
    }


    public getViewNameForDocument(document: Document) {

        return this.viewManager.getViewNameForDocument(document);
    }
}