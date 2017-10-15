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

    public ready: boolean = false;

    private scrollTarget: IdaiFieldDocument;

    private clickEventObservers: Array<any> = [];

    private activeDocumentViewTab: string;

    constructor(route: ActivatedRoute,
                private viewManager: ViewManager,
                private routingHelper: RoutingHelper,
                private doceditProxy: DoceditProxy,
                private renderer: Renderer,
                private datastore: IdaiFieldDatastore, // TODO remove, handle documentChanges directly in documentsManager
                private messages: Messages, // TODO remove dependency, or otherwise remove messages dependency from the various services
                private loading: Loading,
                private mainTypeManager: MainTypeManager,
                private documentsManager: DocumentsManager
    ) {
        routingHelper.routeParams(route).subscribe(params => {

            this.ready = false;

            this.documentsManager.selectedDocument = undefined;
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

        this.initializeClickEventListener();
    }


    ngAfterViewChecked() {

        if (this.scrollTarget) {
            if (ResourcesComponent.scrollToDocument(this.scrollTarget)) {
                this.scrollTarget = undefined;
            }
        }
    }

    // TODO remove the method and perform the calls to routingHelper directly. the document selection can be done in routingHelper via documentsManager then. there should be no necessity to call the select method
    public jumpToRelationTarget(documentToSelect: Document, tab?: string) {

        this.routingHelper.jumpToRelationTarget(this.documentsManager.selectedDocument, documentToSelect,
            docToSelect => this.select(docToSelect), tab);
    }


    public initialize(): Promise<any> {

        this.loading.start();
        return Promise.resolve()
            .then(() => this.documentsManager.populateProjectDocument())
            .then(() => this.mainTypeManager.populateMainTypeDocuments(
                this.documentsManager.selectedDocument
            ))
            .then(() => this.documentsManager.populateDocumentList())
            .then(() => (this.ready = true) && this.loading.stop());
    }


    public chooseMainTypeDocumentOption(document: IdaiFieldDocument) {

        this.mainTypeManager.selectMainTypeDocument(
            document,this.documentsManager.selectedDocument,()=>{
                this.activeDocumentViewTab = undefined;
                this.documentsManager.deselect();
            });
        this.documentsManager.populateDocumentList();
    }

    // TODO move the datastore get to documentsManager
    private selectDocumentFromParams(id: string, menu?: string, tab?: string) {

        this.datastore.get(id).then(
            document => {
                    if (menu == 'edit') this.editDocument(document, tab);
                    else {
                        this.activeDocumentViewTab = tab;
                        this.documentsManager.adjustContext(document)
                    }
                },
            () => this.messages.add([M.DATASTORE_NOT_FOUND])
        );
    }


    /** // TODO after the call to this method from jumpToRelationTarget is removed, the method could go to MapWrapperComponent
     * @param documentToSelect the object that should get selected
     */
    public select(documentToSelect: IdaiFieldDocument) {

        if (this.editGeometry && documentToSelect !=
            this.documentsManager.selectedDocument) this.endEditGeometry();

        // TODO move to documentsManager
        if (this.documentsManager.isNewDocumentFromRemote(documentToSelect)) {
            this.documentsManager.removeFromListOfNewDocumentsFromRemote(documentToSelect);
        }
        this.documentsManager.adjustContext(documentToSelect);
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

        if (!this.documentsManager.setQueryString(q)) this.editGeometry = false;

    }


    public setQueryTypes(types: string[]) {

        if (!this.documentsManager.setQueryTypes(types)) this.editGeometry = false;
    }


    public startEditNewDocument(newDocument: IdaiFieldDocument, geometryType: string) {

        this.documentsManager.removeEmptyDocuments();
        this.documentsManager.selectedDocument = newDocument;

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


    public editDocument(document: Document = this.documentsManager.selectedDocument, // TODO can we change it somehow, that both resources component and list component can work directly with doceditProxy?
                        activeTabName?: string) {

        this.editGeometry = false;

        // TODO find out what this is code for. this.documentsManager.selectedDocumentAndAdjustContext was called selectDocument before, and also did not create the records relation
        if (document != this.documentsManager.selectedDocument &&
                document != this.mainTypeManager.selectedMainTypeDocument) {

            this.documentsManager.adjustContext(document);
        }
        // -

        ResourcesComponent.removeRecordsRelation(document); // TODO move to persistenceManager
        this.doceditProxy.editDocument(document, result => {

                if (result['tab']) this.activeDocumentViewTab = result['tab'];
                return this.handleDocumentSelectionOnSaved(result.document);

            }, activeTabName);
    }


    public startEditGeometry() {

        this.editGeometry = true;
    }


    public endEditGeometry() {

        this.editGeometry = false;
        this.documentsManager.populateDocumentList();
    }


    public createGeometry(geometryType: string) {

        this.documentsManager.selectedDocument.resource['geometry'] = { 'type': geometryType };
        this.startEditGeometry();
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


    // TODO move to documentsManager or doceditProxy
    private handleDocumentSelectionOnSaved(document: IdaiFieldDocument) {

        if (document.resource.type == this.viewManager.getView().mainType) {

            this.mainTypeManager.selectMainTypeDocument(
                document, this.documentsManager.selectedDocument,
                ()=>{
                    this.activeDocumentViewTab = undefined;
                    this.documentsManager.deselect();
                });
        } else {

            this.documentsManager.selectedDocument = document;
            this.scrollTarget = document;
        }
    }


    public setMode(mode: string) {

        this.loading.start();
        // The timeout is necessary to make the loading icon appear
        setTimeout(() => {
            this.documentsManager.removeEmptyDocuments();
            this.documentsManager.deselect();
            this.viewManager.setMode(mode);
            this.editGeometry = false;
            this.loading.stop();
        }, 1);
    }


    private static scrollToDocument(doc: IdaiFieldDocument): boolean {

        const element = document.getElementById('resource-' + doc.resource.identifier);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            return true;
        }
        return false;
    }


    private static removeRecordsRelation(document) {

        if (!document) return;
        delete document.resource.relations['records'];
    }
}
