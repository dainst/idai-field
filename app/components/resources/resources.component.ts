import {AfterViewChecked, ChangeDetectorRef, Component, OnDestroy, Renderer2} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {Observable, Subscription} from 'rxjs';
import {Document, FieldDocument, FieldGeometry, Messages, IdaiType} from 'idai-components-2';
import {Loading} from '../../widgets/loading';
import {RoutingService} from '../routing-service';
import {DoceditLauncher} from './service/docedit-launcher';
import {ViewFacade} from './view/view-facade';
import {M} from '../m';
import {TypeUtility} from '../../core/model/type-utility';
import {MoveModalComponent} from './move-modal.component';


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

    public filterOptions: Array<IdaiType> = [];
    private scrollTarget: FieldDocument|undefined;
    private clickEventObservers: Array<any> = [];

    private deselectionSubscription: Subscription;
    private populateDocumentsSubscription: Subscription;
    private changedDocumentFromRemoteSubscription: Subscription;
    private navigationPathSubscription: Subscription;


    constructor(route: ActivatedRoute,
                public viewFacade: ViewFacade,
                private routingService: RoutingService,
                private doceditLauncher: DoceditLauncher,
                private renderer: Renderer2,
                private messages: Messages,
                private loading: Loading,
                private changeDetectorRef: ChangeDetectorRef,
                private typeUtility: TypeUtility,
                private modalService: NgbModal
    ) {
        routingService.routeParams(route).subscribe(async (params: any) => {
            if (params['id']) {
                await this.selectDocumentFromParams(params['id'], params['menu'], params['tab']);
            }
        });

        this.initializeClickEventListener();
        this.initializeSubscriptions();
    }


    public currentModeIs = (mode: string) => (this.viewFacade.getMode() === mode);

    public setQueryString = (q: string) => this.viewFacade.setSearchString(q);

    public getQueryString = () => this.viewFacade.getSearchString();

    public getTypeFilters = () => this.viewFacade.getFilterTypes();

    public solveConflicts = (doc: FieldDocument) => this.editDocument(doc, 'conflicts');

    public setScrollTarget = (doc: FieldDocument|undefined) => this.scrollTarget = doc;

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
        if (this.navigationPathSubscription) this.navigationPathSubscription.unsubscribe();
    }


    public listenToClickEvents(): Observable<Event> {

        return Observable.create((observer: any) => {
            this.clickEventObservers.push(observer);
        });
    }


    private updateFilterOptions() {

        const viewType: string|undefined = this.viewFacade.getViewType();
        if (!viewType) {
            this.filterOptions = [];
        } else {
            this.filterOptions = this.viewFacade.isInOverview()
                ? this.viewFacade.getBypassHierarchy()
                    ? this.typeUtility.getNonImageTypes().filter(type => !type.parentType)
                    : this.typeUtility.getOverviewTopLevelTypes()
                : this.typeUtility.getAllowedRelationDomainTypes('isRecordedIn', viewType);
        }
    }


    public startEditNewDocument(newDocument: FieldDocument, geometryType: string) {

        if (geometryType == 'none') {
            this.editDocument(newDocument);
        } else {
            newDocument.resource['geometry'] = <FieldGeometry> { 'type': geometryType };

            this.viewFacade.addNewDocument(newDocument);
            this.startGeometryEditing();
            this.viewFacade.setMode('map');
        }
    }


    public async editDocument(document: Document|undefined, activeTabName?: string) {

        if (!document) throw 'Called edit document with undefined document';

        this.quitGeometryEditing(document);

        const editedDocument: FieldDocument|undefined
            = await this.doceditLauncher.editDocument(document, activeTabName);
        if (editedDocument) this.scrollTarget = editedDocument;
    }


    public async moveDocument(document: FieldDocument) {

        const modalRef: NgbModalRef = this.modalService.open(MoveModalComponent, { keyboard: false });
        modalRef.componentInstance.setDocument(document);

        try {
            await modalRef.result;
            await this.viewFacade.rebuildNavigationPath();
            await this.routingService.jumpToResource(document);
        } catch(err) {
            if (err !== 'cancel') this.messages.add(err);
        }
    }


    public createGeometry(geometryType: string) {

        (this.viewFacade.getSelectedDocument() as any).resource['geometry'] = { 'type': geometryType };
        this.startGeometryEditing();
    }


    public switchMode(mode: 'map' | 'list') {

        if (!this.isReady()) return;

        // This is so that new elements are properly included and sorted when coming back to list
        if (this.viewFacade.getMode() === 'list' && mode === 'map') {
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

        this.navigationPathSubscription =
            this.viewFacade.navigationPathNotifications().subscribe(() => {
                this.updateFilterOptions();
            });
    }


    private static scrollToDocument(doc: FieldDocument): boolean {

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
