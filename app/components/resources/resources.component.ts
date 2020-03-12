import {AfterViewChecked, ChangeDetectorRef, Component, OnDestroy, Renderer2} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {Observable, Subscription} from 'rxjs';
import {Document, FieldDocument, FieldGeometry, Messages} from 'idai-components-2';
import {Loading} from '../widgets/loading';
import {RoutingService} from '../routing-service';
import {DoceditLauncher} from './service/docedit-launcher';
import {M} from '../messages/m';
import {ProjectTypes} from '../../core/configuration/project-types';
import {MoveModalComponent} from './move-modal.component';
import {AngularUtility} from '../../angular/angular-utility';
import {ResourceDeletion} from './deletion/resource-deletion';
import {IdaiType} from '../../core/configuration/model/idai-type';
import {TabManager} from '../../core/tabs/tab-manager';
import {ResourcesViewMode, ViewFacade} from '../../core/resources/view/view-facade';
import {NavigationService} from '../../core/resources/navigation/navigation-service';


export type PopoverMenu = 'none'|'info'|'children';


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
    public isModalOpened: boolean = false;

    public activePopoverMenu: PopoverMenu = 'none';
    public highlightedDocument: FieldDocument|undefined = undefined;

    public filterOptions: Array<IdaiType> = [];
    private scrollTarget: FieldDocument|undefined;
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
                private changeDetectorRef: ChangeDetectorRef,
                private projectTypes: ProjectTypes,
                private modalService: NgbModal,
                private resourceDeletion: ResourceDeletion,
                private tabManager: TabManager,
                private navigationService: NavigationService
    ) {
        routingService.routeParams(route).subscribe(async (params: any) => {
            this.isEditingGeometry = false;

            if (params['id']) {
                await this.selectDocumentFromParams(params['id'], params['menu'], params['group']);
            }
        });

        this.initializeClickEventListener();
        this.initializeSubscriptions();

        this.viewFacade.navigationPathNotifications().subscribe((_: any) => {
            this.isEditingGeometry = false;
        });

        this.viewFacade.rebuildNavigationPath();
    }


    public isCurrentMode = (mode: string) => (this.viewFacade.getMode() === mode);

    public setQueryString = (q: string) => this.viewFacade.setSearchString(q);

    public getQueryString = () => this.viewFacade.getSearchString();

    public getTypeFilters = () => this.viewFacade.getFilterTypes();

    public setScrollTarget = (doc: FieldDocument|undefined) => this.scrollTarget = doc;

    public setTypeFilters = (types: string[]|undefined) => this.viewFacade.setFilterTypes(types ? types : []);

    public isInExtendedSearchMode = () => this.viewFacade.isInExtendedSearchMode();

    public isReady = () => this.viewFacade.isReady();

    public isInTypesManagement = () => this.viewFacade.isInTypesManagement();


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


    private updateFilterOptions() {

        if (this.viewFacade.isInOverview()) {
            this.filterOptions = this.viewFacade.isInExtendedSearchMode()
                ? this.projectTypes.getFieldTypes().filter(type => !type.parentType)
                : this.projectTypes.getOverviewTopLevelTypes();
        } else if (this.viewFacade.isInTypesManagement()) {
            this.filterOptions = this.projectTypes.getAbstractFieldTypes();
        } else {
            this.filterOptions = this.projectTypes.getAllowedRelationDomainTypes(
                'isRecordedIn',
                (this.viewFacade.getCurrentOperation() as FieldDocument).resource.type
            );
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


    public async editDocument(document: Document|undefined, activeGroup?: string) {

        if (!document) throw 'Called edit document with undefined document';

        this.quitGeometryEditing(document);
        this.isModalOpened = true;

        const editedDocument: FieldDocument|undefined
            = await this.doceditLauncher.editDocument(document, activeGroup);
        if (editedDocument) this.scrollTarget = editedDocument;
        this.isModalOpened = false;
    }


    public async moveDocument(document: FieldDocument) {

        this.quitGeometryEditing();
        this.isModalOpened = true;

        const modalRef: NgbModalRef = this.modalService.open(MoveModalComponent, { keyboard: false });
        modalRef.componentInstance.initialize(document);

        try {
            await modalRef.result;
            await this.viewFacade.deselect();
            await this.viewFacade.rebuildNavigationPath();
            await this.routingService.jumpToResource(document);
        } catch (msgWithParams) {
            if (Array.isArray(msgWithParams)) this.messages.add(msgWithParams);
            // Otherwise, the move modal has been canceled
        }

        this.isModalOpened = false;
    }


    public async deleteDocument(document: FieldDocument) {

        this.quitGeometryEditing();
        this.isModalOpened = true;

        try {
            await this.resourceDeletion.delete(document);
            await this.viewFacade.deselect();
            await this.tabManager.closeTab('resources', document.resource.id);
            this.viewFacade.removeView(document.resource.id);
            await this.viewFacade.rebuildNavigationPath();
            await this.viewFacade.populateDocumentList();
        } catch (msgWithParams) {
            if (Array.isArray(msgWithParams)) this.messages.add(msgWithParams);
            // Otherwise, the delete modal has been canceled.
        }

        this.isModalOpened = false;
    }


    public createGeometry(geometryType: string) {

        (this.viewFacade.getSelectedDocument() as any).resource['geometry'] = { 'type': geometryType };
        this.startGeometryEditing();
    }


    public async switchMode(mode: ResourcesViewMode) {

        if (!this.isReady()) return;

        this.loading.start();
        await AngularUtility.refresh();

        // This is so that new elements are properly included and sorted when coming back to list
        if (this.viewFacade.getMode() === 'list' && mode !== 'list') {
            await this.viewFacade.populateDocumentList();
        }

        this.viewFacade.deselect();
        this.viewFacade.setMode(mode);

        this.loading.stop();
    }


    public isSearchResultsInfoVisible(): boolean {

        return this.viewFacade.getDocuments() !== undefined
            && this.viewFacade.isInExtendedSearchMode()
            && this.viewFacade.isReady();
    }


    public isDocumentLimitExceeded(): boolean {

        const documents: Array<Document> = this.viewFacade.getDocuments();

        return documents
            && documents.length > 0
            && this.viewFacade.getTotalDocumentCount() > documents.length;
    }


    public async select(document: FieldDocument, autoScroll: boolean = false) {

        this.isEditingGeometry = false;

        if (!document) {
            this.viewFacade.deselect();
        } else {
            await this.viewFacade.setSelectedDocument(document.resource.id, false);
        }

        if (autoScroll) this.setScrollTarget(document);
    }


    public isSelected(document: FieldDocument) {

        if (!this.viewFacade.getSelectedDocument()) return false;
        return (this.viewFacade.getSelectedDocument() as FieldDocument).resource.id === document.resource.id;
    }


    public highlightDocument(document: FieldDocument|undefined) {

        this.highlightedDocument = document;
    };


    public isHighlighted(document: FieldDocument): boolean {

        if (!this.highlightedDocument) return false;
        return this.highlightedDocument.resource.id === document.resource.id;
    }


    public async togglePopoverMenu(popoverMenu: PopoverMenu, document: FieldDocument) {

        if (this.isPopoverMenuOpened(popoverMenu, document) || popoverMenu === 'none') {
            this.closePopover();
        } else {
            await this.openPopoverMenu(popoverMenu, document);
        }
    }


    public isPopoverMenuOpened(popoverMenu?: PopoverMenu, document?: FieldDocument): boolean {

        return this.viewFacade.getSelectedDocument() !== undefined
            && ((!popoverMenu && this.activePopoverMenu !== 'none')
                || this.activePopoverMenu === popoverMenu)
            && (!document || this.isSelected(document));
    }


    public closePopover() {

        this.activePopoverMenu = 'none';
        this.highlightedDocument = undefined;
    };


    public async navigatePopoverMenus(direction: 'previous'|'next') {

        const selectedDocument: FieldDocument|undefined = this.viewFacade.getSelectedDocument();
        if (!selectedDocument) return;

        const availablePopoverMenus: string[] = this.getAvailablePopoverMenus(selectedDocument);

        let index: number = availablePopoverMenus.indexOf(this.activePopoverMenu)
            + (direction === 'next' ? 1 : -1);
        if (index < 0) index = availablePopoverMenus.length - 1;
        if (index >= availablePopoverMenus.length) index = 0;

        await this.openPopoverMenu(availablePopoverMenus[index] as PopoverMenu, selectedDocument);
    }


    private async selectDocumentFromParams(id: string, menu: string, group: string|undefined) {

        if (this.viewFacade.getMode() === 'type-grid') {
            return await this.viewFacade.moveInto(id, false, true);
        }

        await this.viewFacade.setSelectedDocument(id);
        this.setScrollTarget(this.viewFacade.getSelectedDocument());

        try {
            if (menu === 'edit') {
                await this.editDocument(this.viewFacade.getSelectedDocument(), group);
            } else {
                await this.viewFacade.setActiveDocumentViewTab(group)
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
            this.viewFacade.populateDocumentsNotifications().subscribe(() => {
                this.changeDetectorRef.detectChanges();
                this.updateFilterOptions();
            });

        this.changedDocumentFromRemoteSubscription =
            this.viewFacade.documentChangedFromRemoteNotifications().subscribe(() => {
                this.changeDetectorRef.detectChanges();
            });
    }


    private async openPopoverMenu(popoverMenu: PopoverMenu, document: FieldDocument) {

        this.activePopoverMenu = popoverMenu;

        if (!this.isSelected(document)) await this.select(document);
    }


    private getAvailablePopoverMenus(document: FieldDocument): string[] {

        const availablePopoverMenus: string[] = ['none', 'info'];
        if (this.navigationService.shouldShowArrowBottomRight(document)) {
            availablePopoverMenus.push('children');
        }

        return availablePopoverMenus;
    }


    private startGeometryEditing() {

        this.isEditingGeometry = true;
    }


    private quitGeometryEditing(document: Document|undefined = this.viewFacade.getSelectedDocument()) {

        if (document && document.resource.geometry && !document.resource.geometry.coordinates) {
            delete document.resource.geometry;
        }

        this.isEditingGeometry = false;
    }


    private static scrollToDocument(doc: FieldDocument): boolean {

        const element = document.getElementById('resource-' + doc.resource.identifier);
        if (element) {
            element.scrollIntoView({ block: 'nearest' });
            return true;
        }
        return false;
    }
}
