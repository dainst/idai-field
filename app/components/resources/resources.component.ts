import {AfterViewChecked, ChangeDetectorRef, Component, OnDestroy, Renderer2} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Observable, Subscription} from 'rxjs';
import {Document, IdaiFieldDocument, IdaiFieldGeometry, Messages} from 'idai-components-2';
import {Loading} from '../../widgets/loading';
import {RoutingService} from '../routing-service';
import {DoceditLauncher} from './service/docedit-launcher';
import {ViewFacade} from './view/view-facade';
import {M} from '../m';


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
export class ResourcesComponent implements AfterViewChecked, OnDestroy {

    public isEditingGeometry: boolean = false;

    private scrollTarget: IdaiFieldDocument|undefined;
    private clickEventObservers: Array<any> = [];

    private deselectionSubscription: Subscription;
    private populateDocumentsSubscription: Subscription;
    private changedDocumentFromRemoteSubscription: Subscription;


    constructor(route: ActivatedRoute,
                public viewFacade: ViewFacade,
                private routingService: RoutingService,
                private doceditLauncher: DoceditLauncher,
                private renderer: Renderer2,
                private messages: Messages,
                private loading: Loading,
                private changeDetectorRef: ChangeDetectorRef
    ) {
        routingService.routeParams(route).subscribe(async (params: any) => {
            if (params['id']) {
                await this.selectDocumentFromParams(params['id'], params['menu'], params['tab']);
            }
        });

        this.initializeClickEventListener();
        this.initializeSubscriptions();
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


    ngOnDestroy() {

        if (this.deselectionSubscription) this.deselectionSubscription.unsubscribe();
        if (this.populateDocumentsSubscription) this.populateDocumentsSubscription.unsubscribe();
        if (this.changedDocumentFromRemoteSubscription) {
            this.changedDocumentFromRemoteSubscription.unsubscribe();
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
        if (result['canceled']) this.viewFacade.removeNewDocument();
    }


    public createGeometry(geometryType: string) {

        (this.viewFacade.getSelectedDocument() as any).resource['geometry'] = { 'type': geometryType };
        this.startGeometryEditing();
    }


    public switchMode(mode: 'map'|'3dMap'|'list') {

        if (!this.isReady()) return;

        // This is so that new elements are properly included and sorted when coming back to list
        if (this.viewFacade.getMode() === 'list' && (mode === 'map' || mode === '3dMap')) {
            this.viewFacade.populateDocumentList();
        }

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
            this.messages.add([M.DATASTORE_ERROR_NOT_FOUND]);
        }
    }


    private initializeClickEventListener() {

        this.renderer.listen('document', 'click', (event: any) =>
            this.clickEventObservers.forEach(observer => observer.next(event)));
    }


    private initializeSubscriptions() {

        this.deselectionSubscription =
            this.viewFacade.deselectionNotifications().subscribe(deselectedDocument => {
                this.quitGeometryEditing(deselectedDocument);
            });

        this.populateDocumentsSubscription =
            this.viewFacade.populateDocumentNotifications().subscribe(() => {
                this.changeDetectorRef.detectChanges();
            });

        this.changedDocumentFromRemoteSubscription =
            this.viewFacade.documentChangedFromRemoteNotifications().subscribe(() => {
                this.changeDetectorRef.detectChanges();
            });
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
