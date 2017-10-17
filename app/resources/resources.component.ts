import {AfterViewChecked, Component, Renderer} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Observable} from 'rxjs/Observable';
import {IdaiFieldDocument, IdaiFieldGeometry} from 'idai-components-2/idai-field-model';
import {Document} from 'idai-components-2/core';
import {Messages} from 'idai-components-2/messages';
import {Loading} from '../widgets/loading';
import {ViewManager} from './service/view-manager';
import {RoutingHelper} from './service/routing-helper';
import {DoceditProxy} from './service/docedit-proxy';
import {MainTypeManager} from './service/main-type-manager';
import {DocumentsManager} from './service/documents-manager';
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

    // TODO both ready and isEditing are for hiding the actions, whereas isEditing also controls the map mode; see if there is a unified solution, also taking loading into consideration

    public isEditing: boolean = false;

    public ready: boolean = false;

    private scrollTarget: IdaiFieldDocument;

    private clickEventObservers: Array<any> = [];

    private activeDocumentViewTab: string;

    constructor(route: ActivatedRoute,
                private viewManager: ViewManager,
                private routingHelper: RoutingHelper,
                private doceditProxy: DoceditProxy,
                private renderer: Renderer,
                private messages: Messages,
                private loading: Loading,
                private mainTypeManager: MainTypeManager,
                private documentsManager: DocumentsManager
    ) {
        routingHelper.routeParams(route).subscribe(params => {

            this.ready = false;

            this.documentsManager.selectedDocument = undefined;
            this.mainTypeManager.init();
            this.isEditing = false;

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


    public initialize(): Promise<any> {

        this.loading.start();
        return Promise.resolve()
            .then(() => this.documentsManager.populateProjectDocument())
            .then(() => this.mainTypeManager.populateMainTypeDocuments(
                this.documentsManager.selected()
            ))
            .then(() => this.documentsManager.populateDocumentList())
            .then(() => (this.ready = true) && this.loading.stop());
    }


    public chooseMainTypeDocumentOption(document: IdaiFieldDocument) {

        this.mainTypeManager.selectMainTypeDocument(
            document,this.documentsManager.selected(),()=>{
                this.activeDocumentViewTab = undefined;
                this.documentsManager.deselect();
            });
        this.documentsManager.populateDocumentList();
    }

    private selectDocumentFromParams(id: string, menu?: string, tab?: string) {

        this.documentsManager.setSelectedById(id).then(
            () => {
                    if (menu == 'edit') this.editDocument(this.documentsManager.selected(), tab);
                    else {
                        this.activeDocumentViewTab = tab;
                    }
                }).catch( () => this.messages.add([M.DATASTORE_NOT_FOUND]));
    }


    /** // TODO after the call to this method from jumpToRelationTarget is removed, the method could go to MapWrapperComponent
     * @param documentToSelect the object that should get selected
     */
    public select(documentToSelect: IdaiFieldDocument) {

        if (this.isEditing && documentToSelect !=
            this.documentsManager.selectedDocument) this.endEditGeometry();

        this.documentsManager.setSelected(documentToSelect);
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

        if (!this.documentsManager.setQueryString(q)) this.isEditing = false;
    }


    public setQueryTypes(types: string[]) {

        if (!this.documentsManager.setQueryTypes(types)) this.isEditing = false;
    }


    public startEditNewDocument(newDocument: IdaiFieldDocument, geometryType: string) {

        this.documentsManager.setSelected(newDocument);

        if (geometryType == 'none') {
            this.editDocument();
        } else {
            newDocument.resource['geometry'] = <IdaiFieldGeometry> { 'type': geometryType };
            this.isEditing = true;
            this.viewManager.setMode('map', false); // TODO store option was introduced only because of this line because before refactoring the mode was not set to resources state. so the exact behaviour has to be kept. review later
        }
    }


    public editDocument(document: Document = this.documentsManager.selectedDocument, // TODO can we change it somehow, that both resources component and list component can work directly with doceditProxy?
                        activeTabName?: string) {

        this.isEditing = false;
        this.documentsManager.setSelected(document);

        ResourcesComponent.removeRecordsRelation(document); // TODO move to persistenceManager
        this.doceditProxy.editDocument(document, result => {

                if (result['tab']) this.activeDocumentViewTab = result['tab'];
                return this.handleDocumentSelectionOnSaved(result.document);

            }, activeTabName);
    }


    public startEditGeometry() {

        this.isEditing = true;
    }


    // TODO Remove
    public endEditGeometry() {

        this.isEditing = false;
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
            this.documentsManager.deselect();
            this.viewManager.setMode(mode);
            this.isEditing = false;
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
