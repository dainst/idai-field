import {AfterViewChecked, Component, Renderer} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Observable} from 'rxjs/Observable';
import {IdaiFieldDocument, IdaiFieldGeometry} from 'idai-components-2/idai-field-model';
import {DocumentChange, Query} from 'idai-components-2/datastore';
import {Action, Document} from 'idai-components-2/core';
import {Messages} from 'idai-components-2/messages';
import {IdaiFieldDatastore} from '../datastore/idai-field-datastore';
import {SettingsService} from '../settings/settings-service';
import {Loading} from '../widgets/loading';
import {M} from '../m';
import {ViewManager} from './service/view-manager';
import {RoutingHelper} from './service/routing-helper';
import {DoceditProxy} from './service/docedit-proxy';


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

    public documents: Array<Document>;
    public selectedDocument: Document;

    public projectDocument: IdaiFieldDocument;
    public mainTypeDocuments: Array<IdaiFieldDocument>;
    public selectedMainTypeDocument: IdaiFieldDocument;

    public ready: boolean = false;

    private newDocumentsFromRemote: Array<Document> = [];
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
                private loading: Loading
    ) {
        routingHelper.routeParams(route).subscribe(params => {

            this.ready = false;

            this.selectedDocument = undefined;
            this.selectedMainTypeDocument = undefined;
            this.mainTypeDocuments = undefined;
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
            this.handleChange(documentChange);
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
            .then(() => {
                return this.populateProjectDocument();
            }).then(() => this.populateMainTypeDocuments())
            .then(() => this.populateDocumentList())
            .then(() => (this.ready = true) && this.loading.stop());
    }


    public chooseMainTypeDocumentOption(document: IdaiFieldDocument) {

        this.selectMainTypeDocument(document);
        this.populateDocumentList();
    }


    private selectDocumentFromParams(id: string, menu?: string, tab?: string) {

        this.datastore.get(id).then(
            document => menu == 'edit' ? this.editDocument(document, tab) : this.setSelected(document, tab),
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

        this.setSelected(documentToSelect);
    }


    public setSelected(documentToSelect: Document, activeTabName?: string): Document {

        this.selectedDocument = documentToSelect;
        if (this.selectedDocument) {
            const res1 = this.selectLinkedMainTypeDocumentForSelectedDocument();
            const res2 = this.invalidateQuerySettingsIfNecessary();
            if (res1 || res2) this.populateDocumentList();
        }

        this.activeDocumentViewTab = activeTabName;

        return this.selectedDocument;
    }


    private selectMainTypeDocument(document: IdaiFieldDocument) {

        this.selectedMainTypeDocument = document;
        this.viewManager.setLastSelectedMainTypeDocumentId(this.selectedMainTypeDocument.resource.id);

        if (this.selectedDocument &&
            ResourcesComponent.getMainTypeDocumentForDocument(
                this.selectedDocument, this.mainTypeDocuments) != this.selectedMainTypeDocument) {

            this.setSelected(undefined);
        }
    }


    private setSelectedMainTypeDocument(): Promise<any> {

        if (this.mainTypeDocuments.length == 0) {
            this.selectedMainTypeDocument = undefined;
            return Promise.resolve();
        }

        if (this.selectedDocument) {
            this.selectedMainTypeDocument =
                ResourcesComponent.getMainTypeDocumentForDocument(
                    this.selectedDocument, this.mainTypeDocuments
                );
            if (!this.selectedMainTypeDocument) this.selectedMainTypeDocument = this.mainTypeDocuments[0];
            return Promise.resolve();
        }

        const mainTypeDocumentId = this.viewManager.getLastSelectedMainTypeDocumentId();
        if (!mainTypeDocumentId) {
            this.selectedMainTypeDocument = this.mainTypeDocuments[0];
            return Promise.resolve();
        } else {
            return this.datastore.get(mainTypeDocumentId)
                .then(document => this.selectedMainTypeDocument = document as IdaiFieldDocument)
                .catch(() => {
                    this.viewManager.removeActiveLayersIds(mainTypeDocumentId);
                    this.viewManager.setLastSelectedMainTypeDocumentId(undefined);
                    this.selectedMainTypeDocument = this.mainTypeDocuments[0];
                    return Promise.resolve();
                })
        }
    }


    public getSelected(): Document {

        return this.selectedDocument;
    }


    public deselect() {

        this.selectedDocument = undefined;
    }


    private handleChange(documentChange: DocumentChange) {

        if (documentChange.type == 'deleted') {
            console.debug('unhandled deleted document');
            return;
        }

        let changedDocument: Document = documentChange.document;

        if (!this.documents || !this.isRemoteChange(changedDocument)) return;
        if (ResourcesComponent.isExistingDoc(changedDocument, this.documents)) return;

        if (changedDocument.resource.type == this.viewManager.getView().mainType) return this.populateMainTypeDocuments();

        let oldDocuments = this.documents;
        this.populateDocumentList().then(() => {
            for (let doc of this.documents) {
                if (oldDocuments.indexOf(doc) == -1 && this.isRemoteChange(doc)) {
                    this.newDocumentsFromRemote.push(doc);
                }
            }
        });
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

        this.populateDocumentList();
    }


    public setQueryTypes(types: string[]) {

        this.viewManager.setFilterTypes(types);

        if (!this.viewManager.isSelectedDocumentTypeInTypeFilters(this.selectedDocument)) {
            this.editGeometry = false;
            this.deselect();
        }

        this.populateDocumentList();
    }


    public remove(document: Document) {

        this.documents.splice(this.documents.indexOf(document), 1);
    }


    public getQuery() {

        return {
            q: this.viewManager.getQueryString(),
            types: this.viewManager.getQueryTypes()
        }
    }


    /**
     * @returns {boolean} true if list needs to be reloaded afterwards
     */
    private invalidateQuerySettingsIfNecessary(): boolean {

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


    /**
     * @returns {boolean} true if list needs to be reloaded afterwards
     */
    private selectLinkedMainTypeDocumentForSelectedDocument(): boolean {

        if (!this.mainTypeDocuments || this.mainTypeDocuments.length == 0) return false;

        let mainTypeDocument = ResourcesComponent.getMainTypeDocumentForDocument(
            this.selectedDocument, this.mainTypeDocuments);

        if (mainTypeDocument != this.selectedMainTypeDocument) {
            this.selectedMainTypeDocument = mainTypeDocument;
            return true;
        }

        return false;
    }


    private populateProjectDocument(): Promise<any> {

        return this.datastore.get(this.settingsService.getSelectedProject())
            .then(document => this.projectDocument = document as IdaiFieldDocument)
            .catch(err => Promise.reject([M.DATASTORE_NOT_FOUND]));
    }

    /**
     * Populates the document list with all documents from
     * the datastore which match a <code>query</code>
     */
    private populateDocumentList() {

        this.newDocumentsFromRemote = [];

        if (!this.selectedMainTypeDocument) {
            this.documents = [];
            return Promise.resolve();
        }

        return this.fetchDocuments(ResourcesComponent.makeDocsQuery(
            {q: this.viewManager.getQueryString(), types: this.viewManager.getQueryTypes()},
                    this.selectedMainTypeDocument.resource.id))
            .then(documents => this.documents = documents);
    }

    private populateMainTypeDocuments(): Promise<any> {

        if (!this.viewManager.getView()) return Promise.resolve();

        return this.fetchDocuments(
                ResourcesComponent.makeMainTypeQuery(this.viewManager.getView().mainType))
            .then(documents => {
                this.mainTypeDocuments = documents as Array<IdaiFieldDocument>;
                return this.setSelectedMainTypeDocument();
            });
    }

    private fetchDocuments(query: Query): Promise<any> {

        this.loading.start();
        return this.datastore.find(query)
            .catch(errWithParams => this.handleFindErr(errWithParams, query))
            .then(documents => {
                this.loading.stop(); return documents;
            });
    }


    public startEditNewDocument(newDocument: IdaiFieldDocument, geometryType: string) {

        this.removeEmptyDocuments();
        this.selectedDocument = newDocument;

        if (geometryType == 'none') {
            this.editDocument();
        } else {
            newDocument.resource['geometry'] = <IdaiFieldGeometry> { 'type': geometryType };
            this.editGeometry = true;
            this.viewManager.setMode('map', false); // TODO store option was introduced only because of this line because before refactoring the mode was not set to resources state. so the exact behaviour has to be kept. review later
        }

        if (newDocument.resource.type != this.viewManager.getView().mainType) {
            this.documents.unshift(<Document> newDocument);
        }
    }


    public editDocument(document: Document = this.selectedDocument, activeTabName?: string) {

        this.editGeometry = false;
        if (document != this.selectedDocument && document != this.selectedMainTypeDocument) this.setSelected(document);

        this.doceditProxy.editDocument(document, result => {

                if (result['tab']) this.activeDocumentViewTab = result['tab'];
                return this.populateMainTypeDocuments().then(() => {
                        this.invalidateQuerySettingsIfNecessary();
                        this.handleDocumentSelectionOnSaved(result.document);
                    });

            }, closeReason => {
                this.removeEmptyDocuments();
                if (closeReason == 'deleted') {
                    this.selectedDocument = undefined;
                    if (document == this.selectedMainTypeDocument) return this.handleMainTypeDocumentOnDeleted();
                }
            },
            activeTabName)

            .then(() => this.populateDocumentList()); // do this in every case, since this is also the trigger for the map to get repainted with updated documents
    }

    public startEditGeometry() {

        this.editGeometry = true;
    }

    public endEditGeometry() {

        this.editGeometry = false;
        this.populateDocumentList();
    }

    public createGeometry(geometryType: string) {

        this.selectedDocument.resource['geometry'] = { 'type': geometryType };
        this.startEditGeometry();
    }

    public isNewDocumentFromRemote(document: Document): boolean {

        return this.newDocumentsFromRemote.indexOf(document) > -1;
    }


    public removeFromListOfNewDocumentsFromRemote(document: Document) {

        let index = this.newDocumentsFromRemote.indexOf(document);
        if (index > -1) this.newDocumentsFromRemote.splice(index, 1);
    }


    public isRemoteChange(changedDocument: Document): boolean {

        const latestAction: Action =
            (changedDocument.modified && changedDocument.modified.length > 0)
            ? changedDocument.modified[changedDocument.modified.length - 1]
            : changedDocument.created;

        return latestAction && latestAction.user != this.settingsService.getUsername();
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

            this.selectMainTypeDocument(document);
        } else {

            this.selectedDocument = document;
            this.scrollTarget = document;
        }
    }


    private handleMainTypeDocumentOnDeleted() {

        this.viewManager.removeActiveLayersIds(this.selectedMainTypeDocument.resource.id);
        this.viewManager.setLastSelectedMainTypeDocumentId(undefined);
        return this.populateMainTypeDocuments();
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
            this.removeEmptyDocuments();
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


    private removeEmptyDocuments() {

        if (!this.documents) return;

        for (let document of this.documents) {
            if (!document.resource.id) this.remove(document);
        }
    }


    private handleFindErr(errWithParams: Array<string>, query: Query) {

        console.error('Error with find. Query:', query);
        if (errWithParams.length == 2) console.error('Error with find. Cause:', errWithParams[1]);
        this.messages.add([M.ALL_FIND_ERROR]);
    }


    private static isExistingDoc(changedDocument: Document, documents: Array<Document>): boolean {

        for (let doc of documents) {
            if (!doc.resource || !changedDocument.resource) continue;
            if (!doc.resource.id || !changedDocument.resource.id) continue;
            if (doc.resource.id == changedDocument.resource.id) return true;
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


    private static makeDocsQuery(query: Query, mainTypeDocumentResourceId: string): Query {

        const clonedQuery = JSON.parse(JSON.stringify(query));
        clonedQuery.constraints = { 'resource.relations.isRecordedIn': mainTypeDocumentResourceId };
        return clonedQuery;
    }


    private static makeMainTypeQuery(mainType: string): Query {

        return { types: [mainType] };
    }
}
