import {AfterViewChecked, Component, Renderer} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Observable} from 'rxjs/Observable';
import {
    IdaiFieldDocument,
    IdaiFieldGeometry
} from 'idai-components-2/idai-field-model';
import {Document} from 'idai-components-2/core';
import {Messages} from 'idai-components-2/messages';
import {IdaiFieldDatastore} from '../datastore/idai-field-datastore';
import {SettingsService} from '../settings/settings-service';
import {Loading} from '../widgets/loading';
import {M} from '../m';
import {ViewManager} from './service/view-manager';
import {RoutingHelper} from './service/routing-helper';
import {DoceditProxy} from './service/docedit-proxy';
import {MainTypeManager} from './service/main-type-manager';
import {DocumentsManager} from './service/documents-manager';


@Component({
    moduleId: module.id,
    templateUrl: './resources.html'
})
/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 * @author Jan G. Wieners
 * @author Thomas Kleinke
 */
export class ResourcesComponent implements AfterViewChecked {

    public editGeometry: boolean = false;

    public projectDocument: IdaiFieldDocument;

    public selectedDocument: Document;

    public ready: boolean = false;


    private scrollTarget: IdaiFieldDocument;

    private clickEventObservers: Array<any> = [];

    private subscription;

    private activeDocumentViewTab: string;

    constructor(route: ActivatedRoute,
                private viewManager: ViewManager,
                private routingHelper: RoutingHelper,
                private doceditProxy: DoceditProxy,
                private renderer: Renderer,
                private datastore: IdaiFieldDatastore,
                private settingsService: SettingsService,
                private messages: Messages,
                private loading: Loading,
                private mainTypeManager: MainTypeManager,
                private documentsManager: DocumentsManager
    ) {
        routingHelper.routeParams(route).subscribe(params => {

            this.ready = false;

            this.selectedDocument = undefined;
            this.mainTypeManager.init();
            this.editGeometry = false;

            return this.initialize()
                .then(() => {
                    if (params['id']) {
                        // TODO Remove timeout (it is currently used to prevent buggy map behavior after following a relation link from image component to resources component)
                        setTimeout(() => {
                            this.selectDocumentFromParams(params['id'], params['menu'], params['tab']);
                        }, 100);
                    }
                })
                .catch(msgWithParams => {
                    if (msgWithParams) this.messages.add(msgWithParams);
                });
        });

        this.subscription = datastore.documentChangesNotifications().subscribe(documentChange => {
            this.documentsManager.handleChange(
                documentChange, this.selectedDocument);
        });

        this.initializeClickEventListener();
    }


    ngOnDestroy() {

        this.subscription.unsubscribe();
    }


    ngAfterViewChecked() {

        if (this.scrollTarget) {
            if (this.scrollToDocument(this.scrollTarget)) {
                this.scrollTarget = undefined;
            }
        }
    }


    public jumpToRelationTarget(documentToSelect: Document, tab?: string) {

        this.routingHelper.jumpToRelationTarget(this.selectedDocument, documentToSelect,
            docToSelect => this.select(docToSelect), tab);
    }


    public stop() {

        this.ready = false;
    }


    public initialize(): Promise<any> {

        this.loading.start();
        return Promise.resolve()
            .then(() => this.populateProjectDocument())
            .then(() => this.mainTypeManager.populateMainTypeDocuments(
                this.selectedDocument
            ))
            .then(() => this.documentsManager.populateDocumentList())
            .then(() => (this.ready = true) && this.loading.stop());
    }


    public chooseMainTypeDocumentOption(document: IdaiFieldDocument) {

        this.mainTypeManager.selectMainTypeDocument(
            document,this.selectedDocument,()=>{this.selectDocumentAndAdjustContext(undefined);});
        this.documentsManager.populateDocumentList();
    }


    private selectDocumentFromParams(id: string, menu?: string, tab?: string) {

        this.datastore.get(id).then(
            document => menu == 'edit' ? this.editDocument(document, tab) : this.selectDocumentAndAdjustContext(document, tab),
            () => this.messages.add([M.DATASTORE_NOT_FOUND])
        );
    }


    /**
     * TODO since there are to many methods with 'select' in their names, try to get rid of this method or move it to MapWrapper. It is called only from there.
     * @param documentToSelect the object that should get selected
     */
    public select(documentToSelect: IdaiFieldDocument) {

        if (this.editGeometry && documentToSelect !=
            this.selectedDocument) this.endEditGeometry();

        if (this.isNewDocumentFromRemote(documentToSelect)) {
            this.removeFromListOfNewDocumentsFromRemote(documentToSelect);
        }

        this.selectDocumentAndAdjustContext(documentToSelect);
    }


    /**
     * Sets the this.selectedDocument (and this.activeTabName)
     * and if necessary, also
     * a) selects the operation type document,
     * this.selectedDocument is recorded in, accordingly and
     * b) invalidates query settings in order to make sure
     * this.selectedDocument is part of the search hits of the document list
     * on the left hand side in the map view.
     *
     * The method also creates records relations (as inverse relations
     * of isRecordedIn) for operation type resources if we are in project view.
     *
     * @param documentToSelect
     * @param activeTabName
     * @returns {Document}
     */
    public selectDocumentAndAdjustContext(
            documentToSelect: Document,
            activeTabName?: string): Document {

        this.selectedDocument = documentToSelect;
        this.activeDocumentViewTab = activeTabName;
        this.adjustContext();
        return this.selectedDocument;
    }


    private adjustContext() {

        if (!this.selectedDocument) return;

        const res1 = this.mainTypeManager.
            selectLinkedMainTypeDocumentForSelectedDocument(this.selectedDocument);
        const res2 = this.invalidateQuerySettingsIfNecessary();

        let promise = Promise.resolve();
        if (res1 || res2) promise = this.documentsManager.populateDocumentList();

        promise.then(() => this.insertRecordsRelation());
    }


    public getSelected(): Document {

        return this.selectedDocument;
    }


    public deselect() {

        this.selectedDocument = undefined;
    }


    private initializeClickEventListener() {

        this.renderer.listenGlobal('document', 'click', event => {
            for (let clickEventObserver of this.clickEventObservers) {
                clickEventObserver.next(event);
            }
        });
    }


    public listenToClickEvents(): Observable<Event> {

        return Observable.create(observer => {
            this.clickEventObservers.push(observer);
        });
    }


    public setQueryString(q: string) {

        this.viewManager.setQueryString(q);

        if (!this.viewManager.isSelectedDocumentMatchedByQueryString(this.selectedDocument)) {
            this.editGeometry = false;
            this.deselect();
        }

        this.documentsManager.populateDocumentList();
    }


    public setQueryTypes(types: string[]) {

        this.viewManager.setFilterTypes(types);

        if (!this.viewManager.isSelectedDocumentTypeInTypeFilters(this.selectedDocument)) {
            this.editGeometry = false;
            this.deselect();
        }

        this.documentsManager.populateDocumentList();
    }


    public getQuery() {

        return {
            q: this.viewManager.getQueryString(),
            types: this.viewManager.getQueryTypes()
        }
    }


    private populateProjectDocument(): Promise<any> {

        return this.datastore.get(this.settingsService.getSelectedProject())
            .then(document => this.projectDocument = document as IdaiFieldDocument)
            .catch(err => Promise.reject([M.DATASTORE_NOT_FOUND]));
    }


    public startEditNewDocument(newDocument: IdaiFieldDocument, geometryType: string) {

        this.documentsManager.removeEmptyDocuments();
        this.selectedDocument = newDocument;

        if (geometryType == 'none') {
            this.editDocument();
        } else {
            newDocument.resource['geometry'] = <IdaiFieldGeometry> { 'type': geometryType };
            this.editGeometry = true;
            this.viewManager.setMode('map', false); // TODO store option was introduced only because of this line because before refactoring the mode was not set to resources state. so the exact behaviour has to be kept. review later
        }

        if (newDocument.resource.type != this.viewManager.getView().mainType) {
            this.documentsManager.documents.unshift(<Document> newDocument);
        }
    }


    public editDocument(document: Document = this.selectedDocument,
                        activeTabName?: string) {

        this.editGeometry = false;

        // TODO find out what this is code for. this.selectedDocumentAndAdjustContext was called selectDocument before, and also did not create the records relation
        if (document != this.selectedDocument &&
                document != this.mainTypeManager.selectedMainTypeDocument) {

            this.selectDocumentAndAdjustContext(document);
        }
        // -

        ResourcesComponent.removeRecordsRelation(document);
        this.doceditProxy.editDocument(document, result => {

                if (result['tab']) this.activeDocumentViewTab = result['tab'];
                return this.mainTypeManager.populateMainTypeDocuments(
                    this.selectedDocument
                ).then(() => {
                        this.invalidateQuerySettingsIfNecessary();
                        this.handleDocumentSelectionOnSaved(result.document);
                    });

            }, closeReason => {
                this.documentsManager.removeEmptyDocuments();
                if (closeReason == 'deleted') {
                    this.selectedDocument = undefined;
                    if (document == this.mainTypeManager.selectedMainTypeDocument) {
                        return this.mainTypeManager.
                            handleMainTypeDocumentOnDeleted(this.selectedDocument);
                    }
                }
            },
            activeTabName)

            .then(() => this.documentsManager.populateDocumentList()) // do this in every case, since this is also the trigger for the map to get repainted with updated documents
            .then(() => this.insertRecordsRelation());
    }


    private static removeRecordsRelation(document) {

        if (!document) return;
        delete document.resource.relations['records'];
    }


    public startEditGeometry() {

        this.editGeometry = true;
    }


    public endEditGeometry() {

        this.editGeometry = false;
        this.documentsManager.populateDocumentList();
    }


    public createGeometry(geometryType: string) {

        this.selectedDocument.resource['geometry'] = { 'type': geometryType };
        this.startEditGeometry();
    }


    public isNewDocumentFromRemote(document: Document): boolean {

        return this.documentsManager.newDocumentsFromRemote.indexOf(document) > -1;
    }


    public removeFromListOfNewDocumentsFromRemote(document: Document) {

        let index = this.documentsManager.newDocumentsFromRemote.indexOf(document);
        if (index > -1) this.documentsManager.newDocumentsFromRemote.splice(index, 1);
    }


    public solveConflicts(doc: IdaiFieldDocument) {

        this.editDocument(doc, 'conflicts');
    }


    public startEdit(doc: IdaiFieldDocument, activeTabName?: string) {

        this.editDocument(doc, activeTabName);
    }


    public setScrollTarget(doc: IdaiFieldDocument) {

        this.scrollTarget = doc;
    }


    private handleDocumentSelectionOnSaved(document: IdaiFieldDocument) {

        if (document.resource.type == this.viewManager.getView().mainType) {

            this.mainTypeManager.selectMainTypeDocument(
                document, this.selectedDocument,
                ()=>{this.selectDocumentAndAdjustContext(undefined);});
        } else {

            this.selectedDocument = document;
            this.scrollTarget = document;
        }
    }


    private scrollToDocument(doc: IdaiFieldDocument): boolean {

        let element = document.getElementById('resource-' + doc.resource.identifier);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            return true;
        }
        return false;  
    }


    public setMode(mode: string) {

        this.loading.start();
        // The timeout is necessary to make the loading icon appear
        setTimeout(() => {
            this.documentsManager.removeEmptyDocuments();
            this.selectedDocument = undefined;
            this.viewManager.setMode(mode);
            this.editGeometry = false;
            this.loading.stop();
        }, 1);
    }


    public getCurrentFilterType()  {

        return (this.viewManager.getFilterTypes() &&
            this.viewManager.getFilterTypes().length > 0 ?
            this.viewManager.getFilterTypes()[0] : undefined);
    }


    public insertRecordsRelation() {

        if (!this.selectedDocument) return;
        if (this.mainTypeManager.selectedMainTypeDocument.resource.type != 'Project') return;

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
}
