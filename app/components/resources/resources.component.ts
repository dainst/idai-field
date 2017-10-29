import {AfterViewChecked, Component, Renderer} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Observable} from 'rxjs/Observable';
import {IdaiFieldDocument, IdaiFieldGeometry} from 'idai-components-2/idai-field-model';
import {Document} from 'idai-components-2/core';
import {Messages} from 'idai-components-2/messages';
import {Loading} from '../../widgets/loading';
import {RoutingService} from '../routing-service';
import {DoceditProxy} from './service/docedit-proxy';
import {M} from '../../m';
import {ViewFacade} from './view/view-facade';
import {ImageUploader} from '../imageupload/image-uploader';
import {ModelUtil} from '../../core/model/model-util';


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

    public ready: boolean = true; // TODO remove, lets make use of loading instead

    private scrollTarget: IdaiFieldDocument|undefined;

    private clickEventObservers: Array<any> = [];

    private activeDocumentViewTab: string;

    public getDocumentLabel = (document: any) => ModelUtil.getDocumentLabel(document);


    constructor(route: ActivatedRoute,
                private viewFacade: ViewFacade,
                private routingService: RoutingService,
                private doceditProxy: DoceditProxy,
                private imageUploader: ImageUploader,
                private renderer: Renderer,
                private messages: Messages,
                private loading: Loading
    ) {
        loading.start(); console.error("hi")
        routingService.routeParams(route).subscribe((params: any) => {
            loading.stop();

            this.isEditingGeometry = false;
            this.viewFacade.setSelectedDocument(undefined as any);

            if (params['id']) {
                // The timeout is needed to prevent buggy map behavior after following a relation link from
                // image component to resources component and after following a conflict resolver link from
                // taskbar
                setTimeout(() => {
                    this.selectDocumentFromParams(params['id'], params['menu'], params['tab']).then(() => {
                    })
                }, 100);
            }
        });
        this.initializeClickEventListener();
    }


    public getIsRecordedInTarget() {

        if (this.viewFacade.isInOverview()) return this.viewFacade.getProjectDocument();
        return this.viewFacade.getSelectedMainTypeDocument();
    }


    ngAfterViewChecked() {

        if (this.scrollTarget) {
            if (ResourcesComponent.scrollToDocument(this.scrollTarget)) {
                this.scrollTarget = undefined;
            }
        }
    }


    public async chooseOperationTypeDocumentOption(document: IdaiFieldDocument) {

        const isMatched = this.viewFacade.selectMainTypeDocument(document);
        if (!isMatched) this.activeDocumentViewTab = undefined as any;
    }


    private selectDocumentFromParams(id: string, menu?: string, tab?: string) {

        return this.viewFacade.setSelectedDocumentById(id).then( // <- TODO move this to routing helper
            () => {
                    if (menu == 'edit') this.editDocument(this.viewFacade.getSelectedDocument(), tab);
                    else {
                        this.activeDocumentViewTab = tab as any;
                    }
                }).catch(() => this.messages.add([M.DATASTORE_NOT_FOUND]));
    }


    private initializeClickEventListener() {

        this.renderer.listenGlobal('document', 'click', (event: any) => {
            for (let clickEventObserver of this.clickEventObservers) {
                clickEventObserver.next(event);
            }
        });
    }


    public listenToClickEvents(): Observable<Event> {

        return Observable.create((observer: any) => {
            this.clickEventObservers.push(observer);
        });
    }


    public async setQueryString(q: string) {

        const isMatched = this.viewFacade.setQueryString(q);
        if (!isMatched) this.isEditingGeometry = false;
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


    public async editDocument(document: Document|undefined = this.viewFacade.getSelectedDocument(),
                        activeTabName?: string) {

        this.isEditingGeometry = false;

        const result = await this.doceditProxy.editDocument(document as any, activeTabName);

        if (result['tab']) this.activeDocumentViewTab = result['tab'];
        if (result['updateScrollTarget']) this.scrollTarget = result['document'];
    }


    public createGeometry(geometryType: string) {

        (this.viewFacade.getSelectedDocument() as any).resource['geometry'] = { 'type': geometryType };
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

                if (uploadResult.uploadedImages == 1) {
                    this.messages.add([M.RESOURCES_SUCCESS_IMAGE_UPLOADED, document.resource.identifier]);
                } else if (uploadResult.uploadedImages > 1) {
                    this.messages.add([M.RESOURCES_SUCCESS_IMAGES_UPLOADED, uploadResult.uploadedImages.toString(),
                        document.resource.identifier]);
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
