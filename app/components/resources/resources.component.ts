import {AfterViewChecked, Component, Renderer2} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Observable} from 'rxjs/Observable';
import {IdaiFieldDocument, IdaiFieldGeometry} from 'idai-components-2';
import {Document} from 'idai-components-2';
import {Messages} from 'idai-components-2';
import {Loading} from '../../widgets/loading';
import {RoutingService} from '../routing-service';
import {DoceditLauncher} from './service/docedit-launcher';
import {M} from '../../m';
import {ViewFacade} from './view/view-facade';


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

    private scrollTarget: IdaiFieldDocument|undefined;

    private clickEventObservers: Array<any> = [];


    constructor(route: ActivatedRoute,
                private viewFacade: ViewFacade,
                private routingService: RoutingService,
                private doceditLauncher: DoceditLauncher,
                private renderer: Renderer2,
                private messages: Messages,
                private loading: Loading
    ) {
        routingService.routeParams(route).subscribe(async (params: any) => {
            if (params['id']) {
                await this.selectDocumentFromParams(params['id'], params['menu'], params['tab']);
            }
        });

        this.initializeClickEventListener();

        this.viewFacade.deselectionNotifications().subscribe(deselectedDocument => {
            this.quitGeometryEditing(deselectedDocument);
        });
    }


    public getViewType = () => this.viewFacade.getViewType();

    public currentModeIs = (mode: string) => (this.viewFacade.getMode() === mode);

    public setQueryString = (q: string) => this.viewFacade.setSearchString(q);

    public getQueryString = () => this.viewFacade.getSearchString();

    public getTypeFilters = () => this.viewFacade.getFilterTypes();

    public solveConflicts = (doc: IdaiFieldDocument) => this.editDocument(doc, 'conflicts');

    public setScrollTarget = (doc: IdaiFieldDocument|undefined) => this.scrollTarget = doc;

    public setTypeFilters = (types: string[]|undefined) => this.viewFacade.setFilterTypes(types ? types : []);

    public isViewWithoutMainTypeDocuments = () => this.isReady() && !this.viewFacade.isInOverview()
        && this.viewFacade.getSelectedOperations().length < 1 && !this.isEditingGeometry;

    public getBypassHierarchy = () => this.viewFacade.getBypassHierarchy();

    public isReady = () => this.viewFacade.isReady();


    ngAfterViewChecked() {

        if (this.scrollTarget) {
            if (ResourcesComponent.scrollToDocument(this.scrollTarget)) {
                this.scrollTarget = undefined;
            }
        }
    }


    public listenToClickEvents(): Observable<Event> {

        return Observable.create((observer: any) => {
            this.clickEventObservers.push(observer);
        });
    }


    public startEditNewDocument(newDocument: IdaiFieldDocument, geometryType: string) {

        if (geometryType == 'none') {
            this.editDocument(newDocument);
        } else {
            newDocument.resource['geometry'] = <IdaiFieldGeometry> { 'type': geometryType };

            this.viewFacade.addNewDocument(newDocument);
            this.startGeometryEditing();
            this.viewFacade.setMode('map');
        }
    }


    public async editDocument(document: Document|undefined, activeTabName?: string) {

        if (!document) throw 'Called edit document with undefined document';

        this.quitGeometryEditing(document);

        const result = await this.doceditLauncher.editDocument(document, activeTabName);
        if (result['tab']) this.viewFacade.setActiveDocumentViewTab(result['tab']);
        if (result['updateScrollTarget']) this.scrollTarget = result['document'];
    }


    public createGeometry(geometryType: string) {

        (this.viewFacade.getSelectedDocument() as any).resource['geometry'] = { 'type': geometryType };
        this.startGeometryEditing();
    }


    public switchMode(mode: 'map' | 'list') {

        if (!this.isReady()) return;

        // this is so that new elements are properly included and sorted when coming back to list
        if (this.viewFacade.getMode() === 'list'
            && mode === 'map') this.viewFacade.populateDocumentList();

        this.loading.start();
        // The timeout is necessary to make the loading icon appear
        setTimeout(() => {
            this.viewFacade.deselect();
            this.viewFacade.setMode(mode);
            this.loading.stop();
        }, 1);
    }


    private async selectDocumentFromParams(id: string, menu: string, tab: string) {

        await this.viewFacade.setSelectedDocument(id);
        this.setScrollTarget(this.viewFacade.getSelectedDocument());

        try {
            if (menu == 'edit') {
                await this.editDocument(this.viewFacade.getSelectedDocument(), tab);
            } else {
                await this.viewFacade.setActiveDocumentViewTab(tab)
            }
        } catch (e) {
            this.messages.add([M.DATASTORE_NOT_FOUND]);
        }
    }


    private initializeClickEventListener() {

        this.renderer.listen('document', 'click', (event: any) =>
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


    private startGeometryEditing() {

        this.isEditingGeometry = true;
    }


    private quitGeometryEditing(deselectedDocument: Document) {

        if (deselectedDocument.resource.geometry && !deselectedDocument.resource.geometry.coordinates) {
            delete deselectedDocument.resource.geometry;
        }

        this.isEditingGeometry = false;
    }
}
