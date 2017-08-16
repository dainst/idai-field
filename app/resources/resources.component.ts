import {Component, AfterViewChecked, OnDestroy, Renderer} from '@angular/core';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {Location} from '@angular/common';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {Observable} from 'rxjs/Observable';
import {IdaiFieldDocument, IdaiFieldGeometry} from 'idai-components-2/idai-field-model';
import {Query} from 'idai-components-2/datastore';
import {Document, Action} from 'idai-components-2/core';
import {DocumentEditChangeMonitor} from 'idai-components-2/documents';
import {Messages} from 'idai-components-2/messages';
import {ConfigLoader, ViewDefinition} from 'idai-components-2/configuration';
import {IdaiFieldDatastore} from '../datastore/idai-field-datastore';
import {SettingsService} from '../settings/settings-service';
import {DoceditComponent} from '../docedit/docedit.component';
import {ViewUtility} from '../util/view-utility';
import {Loading} from '../widgets/loading';
import {ResourcesState} from './resources-state';
import {M} from "../m";


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

    public view: ViewDefinition;
    public mainTypeLabel: string;
    public mode: string; // 'map' or 'list'
    public editGeometry: boolean = false;

    public query: Query = { q: '' }; // TODO remove definition. it gets initialized in initializeQuery
    public filterType: string;

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

    constructor(private route: ActivatedRoute,
                private router: Router,
                private location: Location,
                private renderer: Renderer,
                private datastore: IdaiFieldDatastore,
                private settingsService: SettingsService,
                private modalService: NgbModal,
                private documentEditChangeMonitor: DocumentEditChangeMonitor,
                private messages: Messages,
                private configLoader: ConfigLoader,
                private viewUtility: ViewUtility,
                private loading: Loading,
                private resourcesState: ResourcesState
    ) {
        this.route.params.subscribe(params => {

            this.setupViewFrom(params)
                .then(() => this.initialize())
                .catch(msgWithParams => {
                    if (msgWithParams) this.messages.add(msgWithParams)
                });
        });

        const self = this; // TODO remove unnecessary tmpvar
        this.subscription = datastore.documentChangesNotifications().subscribe(result => {
            self.handleChange(result);
        });

        this.initializeClickEventListener();
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    ngAfterViewChecked() {

        if (this.scrollTarget) {
            this.scrollToDocument(this.scrollTarget);
            this.scrollTarget = undefined;
        }
    }

    private setupViewFrom(params: Params): Promise<any> {

        if (params['id']) this.selectDocumentFromParams(params['id'], params['tab']);

        this.location.replaceState('resources/' + params['view']);

        return (!this.view || params['view'] != this.view.name)
            ? this.initializeView(params['view']) : Promise.resolve();
    }

    public stop() {
        this.ready = false;
    }

    private initializeMode() {

        if (this.resourcesState.getLastSelectedMode(this.view.name)) {
            this.mode = this.resourcesState.getLastSelectedMode(this.view.name);
        } else {
            this.mode = 'map';
            this.resourcesState.setLastSelectedMode(this.view.name, 'map');
        }
    }

    public initialize(): Promise<any> {

        this.ready = false;

        this.selectedDocument = undefined;
        this.selectedMainTypeDocument = undefined;
        this.mainTypeDocuments = undefined;

        this.initializeQuery();
        this.initializeMode();

        this.loading.start();
        return this.populateAll()
            .then(() => (this.ready = true) && this.loading.stop());
    }

    private populateAll(cb?) {

        return this.populateProjectDocument()
            .then(() => this.populateMainTypeDocuments())
            .then(() => {
                if (cb) cb();
                return this.populateDocumentList();
            })
    }

    private initializeView(viewName: string): Promise<any> {

        return this.configLoader.getProjectConfiguration().then(
            projectConfiguration => {
                this.view = projectConfiguration.getView(viewName);
                this.mainTypeLabel = projectConfiguration.getLabelForType(this.view.mainType);
            }
        ).catch(() => Promise.reject(null));
    }

    private selectDocument(document) {

        if (document && document.resource.type == this.view.mainType) {
            this.selectedMainTypeDocument = document;
        } else {
            this.selectedDocument = document;
            this.scrollTarget = document;
        }
    }

    private selectDocumentFromParams(id: string, tab: string) {

        this.datastore.get(id).then(
            document =>  tab ? this.editDocument(document, tab) : this.setSelected(document),
            () => this.messages.add([M.DATASTORE_NOT_FOUND])
        );
    }

    public selectMainTypeDocument(document: IdaiFieldDocument) {

        this.selectedMainTypeDocument = document;
        this.resourcesState.setLastSelectedMainTypeDocument(this.view.name, this.selectedMainTypeDocument);

        if (this.selectedDocument &&
            ResourcesComponent.getMainTypeDocumentForDocument(
                this.selectedDocument, this.mainTypeDocuments) != this.selectedMainTypeDocument) {

            this.setSelected(undefined);
        }

        this.populateDocumentList();
    }

    private handleChange(changedDocument: Document) {

        if (!this.documents || !this.isRemoteChange(changedDocument)) return;
        if (ResourcesComponent.isExistingDoc(changedDocument, this.documents)) return;

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

    /**
     * @param documentToSelect the object that should get selected
     */
    public select(documentToSelect: IdaiFieldDocument) {

        if (this.editGeometry && documentToSelect != this.selectedDocument) this.endEditGeometry();

        if (this.isNewDocumentFromRemote(documentToSelect)) {
            this.removeFromListOfNewDocumentsFromRemote(documentToSelect);
        }

        this.setSelected(documentToSelect);
    }

    public jumpToRelationTarget(documentToSelect: IdaiFieldDocument) {

        this.viewUtility.getViewNameForDocument(documentToSelect)
            .then(viewName => {
                if (viewName != this.view.name) {
                    return this.router.navigate(['resources', viewName, documentToSelect.resource.id]);
                } else {
                    this.select(documentToSelect);
                }
            });
    }

    public setSelected(documentToSelect: Document): Document {

        this.selectedDocument = documentToSelect;
        if (this.selectedDocument) this.selectLinkedMainTypeDocumentForSelectedDocument();

        return this.selectedDocument;
    }

    public getSelected(): Document {

        return this.selectedDocument;
    }

    private selectLinkedMainTypeDocumentForSelectedDocument() {

        if (!this.mainTypeDocuments || this.mainTypeDocuments.length == 0) return;

        let mainTypeDocument = ResourcesComponent.getMainTypeDocumentForDocument(
            this.selectedDocument, this.mainTypeDocuments);

        if (mainTypeDocument != this.selectedMainTypeDocument) {
            this.selectedMainTypeDocument = mainTypeDocument;
            this.populateDocumentList();
        }
    }

    public setQueryString(q: string) {

        this.query.q = q;
        this.populateDocumentList();
    }

    public setQueryType(type: string) {

        type ? this.query.types = [type] : delete this.query.types;

        this.resourcesState.setLastSelectedTypeFilter(this.view.name, type);
        this.filterType = type;

        this.populateDocumentList();
    }

    private initializeQuery() {

        this.query = { q: '' };
        this.filterType = this.resourcesState.getLastSelectedTypeFilter(this.view.name);
        if (this.filterType) this.query.types = [this.filterType];
    }

    public remove(document: Document) {

        this.documents.splice(this.documents.indexOf(document), 1);
    }

    private populateProjectDocument(): Promise<any> {

        return this.datastore.get(this.settingsService.getSelectedProject())
            .then(
                document => this.projectDocument = document as IdaiFieldDocument
            );
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

        return this.fetchDocuments(ResourcesComponent.makeDocsQuery(this.query,
                    this.selectedMainTypeDocument.resource.id))
            .then(documents => this.documents = documents);

    }

    private populateMainTypeDocuments(): Promise <any> {

        if (!this.view) return Promise.resolve();

        return this.fetchDocuments(
                ResourcesComponent.makeMainTypeQuery(this.view.mainType))
            .then(documents => {
                this.mainTypeDocuments = documents as Array<IdaiFieldDocument>;
                this.setSelectedMainTypeDocument();
            })
    }

    private fetchDocuments(f): Promise<any> {

        this.loading.start();
        return this.datastore.find(f())
            .catch(errWithParams => ResourcesComponent.handleFindErr(
                this.messages, errWithParams, this.query)
            )
            .then(documents => {
                this.loading.stop(); return documents;
            });
    }

    private setSelectedMainTypeDocument() {

        if (this.mainTypeDocuments.length == 0) {
            this.selectedMainTypeDocument = undefined;
        } else if (this.selectedDocument) {
            this.selectedMainTypeDocument = ResourcesComponent.getMainTypeDocumentForDocument(this.selectedDocument, this.mainTypeDocuments);
            if (!this.selectedMainTypeDocument) this.selectedMainTypeDocument = this.mainTypeDocuments[0];
        } else {
            const lastSelectedMainTypeDocument = this.resourcesState.getLastSelectedMainTypeDocument(this.view.name);
            if (lastSelectedMainTypeDocument) {
                this.selectedMainTypeDocument = lastSelectedMainTypeDocument;
            } else {
                this.selectedMainTypeDocument = this.mainTypeDocuments[0];
            }
        }
    }

    public startEditNewDocument(newDocument: IdaiFieldDocument, geometryType: string) {

        this.removeEmptyDocuments();
        this.selectedDocument = newDocument;

        if (geometryType == 'none') this.editDocument();
        else {
            newDocument.resource['geometry'] = <IdaiFieldGeometry> { 'type': geometryType };
            this.editGeometry = true;
            this.mode = 'map';
        }

        if (newDocument.resource.type != this.view.mainType) {
            this.documents.unshift(<Document> newDocument);
        }
    }

    public editDocument(document: Document = this.selectedDocument, activeTabName?: string) {

        this.editGeometry = false;
        if (document != this.selectedDocument && document != this.selectedMainTypeDocument) this.setSelected(document);

        const doceditRef = this.modalService.open(DoceditComponent, { size: 'lg', backdrop: 'static' });

        doceditRef.result.then(result =>
                this.populateAll(() => this.selectDocument(result.document))
            , closeReason => {

                this.documentEditChangeMonitor.reset();
                if (closeReason == 'deleted') {
                    this.selectedDocument = undefined;
                    if (document == this.selectedMainTypeDocument) {
                        return this.populateMainTypeDocuments()
                            .then(() => this.populateDocumentList());
                    }
                    this.populateDocumentList();
                }
            });

        const docedit = doceditRef.componentInstance;
        docedit.setDocument(document);
        if (activeTabName) docedit.setActiveTab(activeTabName);
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

    public isNewDocumentFromRemote(document: Document) {

        return this.newDocumentsFromRemote.indexOf(document) > -1;
    }

    public removeFromListOfNewDocumentsFromRemote(document: Document) {

        let index = this.newDocumentsFromRemote.indexOf(document);
        if (index > -1) this.newDocumentsFromRemote.splice(index, 1);
    }

    public isRemoteChange(changedDocument: Document) {

        let latestAction: Action;

        if (changedDocument.modified && changedDocument.modified.length > 0) {
            latestAction = changedDocument.modified[changedDocument.modified.length - 1];
        } else {
            latestAction = changedDocument.created;
        }

        return latestAction && latestAction.user != this.settingsService.getUsername();
    }

    public solveConflicts(doc: IdaiFieldDocument) {

        this.editDocument(doc, 'conflicts');
    }

    public deselect() {

        this.selectedDocument = undefined;
    }

    public startEdit(doc: IdaiFieldDocument) {

        this.editDocument(doc);
    }

    public setScrollTarget(doc: IdaiFieldDocument) {

        this.scrollTarget = doc;
    }

    private scrollToDocument(doc: IdaiFieldDocument) {

        let element = document.getElementById('resource-' + doc.resource.identifier);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
    }

    public setMode(mode: string) {

        this.resourcesState.setLastSelectedMode(this.view.name, mode);

        this.loading.start();
        // The timeout is necessary to make the loading icon appear
        setTimeout(() => {
            this.removeEmptyDocuments();
            this.mode = mode;
            this.editGeometry = false;
            this.loading.stop();
        }, 1);
    }

    private removeEmptyDocuments() {

        if (!this.documents) return;

        for (let document of this.documents) {
            if (!document.resource.id) this.remove(document);
        }
    }

    private static isExistingDoc(changedDocument, documents) {

        let existingDoc = false;
        for (let doc of documents) {
            if (!doc.resource || !changedDocument.resource) continue;
            if (!doc.resource.id || !changedDocument.resource.id) continue;
            if (doc.resource.id == changedDocument.resource.id) {
                existingDoc = true;
            }
        }
        return existingDoc;
    }

    private static getMainTypeDocumentForDocument(document: Document, mainTypeDocuments): IdaiFieldDocument {

        if (!document.resource.relations['isRecordedIn']) return undefined;

        for (let documentId of document.resource.relations['isRecordedIn']) {
            for (let mainTypeDocument of mainTypeDocuments) {
                if (mainTypeDocument.resource.id == documentId) return mainTypeDocument;
            }
        }

        return undefined;
    }

    private static makeDocsQuery(query, mainTypeDocumentResourceId) : Query {

        return () => {
            const q = JSON.parse(JSON.stringify(query));
            q.constraints = { 'resource.relations.isRecordedIn' : mainTypeDocumentResourceId };
            return q;
        }
    }

    private static makeMainTypeQuery(mainType) : Query {

        return () => {
            return { types: [mainType] };
        }
    }

    private static handleFindErr(messages, errWithParams, query) {

        console.error('error with find. query:', query);
        if (errWithParams.length == 2) console.error('error with find. cause:', errWithParams[1]);
        messages.add([M.ALL_FIND_ERROR])
    }
}
