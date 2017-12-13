import {AfterViewChecked, Component, Renderer} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Observable} from 'rxjs/Observable';
import {IdaiFieldDocument, IdaiFieldGeometry} from 'idai-components-2/idai-field-model';
import {Document} from 'idai-components-2/core';
import {Messages} from 'idai-components-2/messages';
import {Loading} from '../../widgets/loading';
import {RoutingService} from '../routing-service';
import {DoceditLauncher} from './service/docedit-launcher';
import {M} from '../../m';
import {ViewFacade} from './view/view-facade';
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


    constructor(route: ActivatedRoute,
                private viewFacade: ViewFacade,
                private routingService: RoutingService,
                private doceditProxy: DoceditLauncher,
                private renderer: Renderer,
                private messages: Messages,
                private loading: Loading
    ) {
        loading.start();
        routingService.routeParams(route).subscribe((params: any) => {
            loading.stop();

            this.isEditingGeometry = false;
            this.viewFacade.deselect();

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


    public getDocumentLabel = (document: any) => ModelUtil.getDocumentLabel(document);


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
        if (!isMatched) this.viewFacade.setActiveDocumentViewTab(undefined);
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


    public async editDocument(document: Document|undefined, activeTabName?: string) {

        if (!document) throw "Called edit document with undefined document";

        this.isEditingGeometry = false;

        const result = await this.doceditProxy.editDocument(document, activeTabName);
        if (result['tab']) this.viewFacade.setActiveDocumentViewTab(result['tab']);
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


    private async selectDocumentFromParams(id: string, menu: string, tab: string) {

        await this.viewFacade.setSelectedDocumentById(id); // <- TODO move this to routing helper
        try {
            await this.viewFacade.setActiveDocumentViewTab(tab)
        } catch (e) {
            this.messages.add([M.DATASTORE_NOT_FOUND]);
        }
    }


    private initializeClickEventListener() {

        this.renderer.listenGlobal('document', 'click', (event: any) =>
            this.clickEventObservers.forEach(observer => observer.next(event)));
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
