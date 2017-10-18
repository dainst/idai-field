import {AfterViewChecked, Component, Renderer} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Observable} from 'rxjs/Observable';
import {IdaiFieldDocument, IdaiFieldGeometry} from 'idai-components-2/idai-field-model';
import {Document} from 'idai-components-2/core';
import {Messages} from 'idai-components-2/messages';
import {Loading} from '../widgets/loading';
import {RoutingHelper} from './service/routing-helper';
import {DoceditProxy} from './service/docedit-proxy';
import {M} from '../m';
import {ViewFacade} from './view/view-facade';
import {ImageUploader} from '../imageupload/image-uploader';


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

    public isEditingGeometry: boolean = false;

    public ready: boolean = false;

    private scrollTarget: IdaiFieldDocument;

    private clickEventObservers: Array<any> = [];

    private activeDocumentViewTab: string;


    constructor(route: ActivatedRoute,
                private viewFacade: ViewFacade,
                private routingHelper: RoutingHelper,
                private doceditProxy: DoceditProxy,
                private imageUploader: ImageUploader,
                private renderer: Renderer,
                private messages: Messages,
                private loading: Loading
    ) {
        routingHelper.routeParams(route).subscribe(params => {

            this.ready = false;

            this.viewFacade.init();
            this.viewFacade.deselect();

            this.isEditingGeometry = false;

            return this.initialize()
                .then(() => {
                    if (params['id']) {
                        // The timeout is needed to prevent buggy map behavior after following a relation link from
                        // image component to resources component and after following a conflict resolver link from
                        // taskbar
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
            .then(() => this.viewFacade.populateProjectDocument())
            .then(() => this.viewFacade.populateMainTypeDocuments(
                this.viewFacade.getSelectedDocument()
            ))
            .then(() => this.viewFacade.populateDocumentList())
            .then(() => (this.ready = true) && this.loading.stop());
    }


    public chooseMainTypeDocumentOption(document: IdaiFieldDocument) {

        this.viewFacade.selectMainTypeDocument(
            document,this.viewFacade.getSelectedDocument(),()=>{
                this.activeDocumentViewTab = undefined;
                this.viewFacade.deselect();
            });
        this.viewFacade.populateDocumentList();
    }


    private selectDocumentFromParams(id: string, menu?: string, tab?: string) {

        this.viewFacade.setSelectedDocumentById(id).then(
            () => {
                    if (menu == 'edit') this.editDocument(this.viewFacade.getSelectedDocument(), tab);
                    else {
                        this.activeDocumentViewTab = tab;
                    }
                }).catch(() => this.messages.add([M.DATASTORE_NOT_FOUND]));
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

        if (!this.viewFacade.setQueryString(q)) this.isEditingGeometry = false;
    }


    public setQueryTypes(types: string[]) {

        if (!this.viewFacade.setQueryTypes(types)) this.isEditingGeometry = false;
    }


    public startEditNewDocument(newDocument: IdaiFieldDocument, geometryType: string) {

        if (geometryType == 'none') {
            this.editDocument(newDocument);
        } else {
            newDocument.resource['geometry'] = <IdaiFieldGeometry> { 'type': geometryType };

            this.viewFacade.setSelectedDocument(newDocument);
            this.isEditingGeometry = true;
            this.viewFacade.setMode('map');
        }
    }


    public editDocument(document: Document = this.viewFacade.getSelectedDocument(), // TODO can we change it somehow, that both resources component and list component can work directly with doceditProxy?
                        activeTabName?: string) {

        this.isEditingGeometry = false;

        this.doceditProxy.editDocument(document, activeTabName).then(
            result => {
                if (result['tab']) this.activeDocumentViewTab = result['tab'];
                if (result['updateScrollTarget']) this.scrollTarget = result['document'];
            }
        );
    }


    public createGeometry(geometryType: string) {

        this.viewFacade.getSelectedDocument().resource['geometry'] = { 'type': geometryType };
        this.isEditingGeometry = true;
    }


    public solveConflicts(doc: IdaiFieldDocument) {

        this.editDocument(doc, 'conflicts');
    }


    public setScrollTarget(doc: IdaiFieldDocument) {

        this.scrollTarget = doc;
    }


    public setMode(mode: string) {

        this.loading.start();
        // The timeout is necessary to make the loading icon appear
        setTimeout(() => {
            this.viewFacade.deselect();
            this.viewFacade.setMode(mode);
            this.isEditingGeometry = false;
            this.loading.stop();
        }, 1);
    }


    public uploadImages(event: Event, document: IdaiFieldDocument): Promise<any> {

        return this.imageUploader.startUpload(event, document.resource.id).then(
            uploadResult => {
                for (let msgWithParams of uploadResult.messages) {
                    this.messages.add(msgWithParams);
                }
            }
        )
    }


    private static scrollToDocument(doc: IdaiFieldDocument): boolean {

        const element = document.getElementById('resource-' + doc.resource.identifier);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            return true;
        }
        return false;
    }
}
