import { ChangeDetectorRef, Component, OnDestroy, Renderer2 } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable, Subscription } from 'rxjs';
import { Document, FieldDocument, FieldGeometry, CategoryForm, ProjectConfiguration } from 'idai-field-core';
import { Loading } from '../widgets/loading';
import { Routing } from '../../services/routing';
import { DoceditLauncher } from './service/docedit-launcher';
import { M } from '../messages/m';
import { MoveModalComponent } from './move-modal.component';
import { AngularUtility } from '../../angular/angular-utility';
import { ResourceDeletion } from './deletion/resource-deletion';
import { TabManager } from '../../services/tabs/tab-manager';
import { ResourcesViewMode, ViewFacade } from '../../components/resources/view/view-facade';
import { NavigationService } from './navigation/navigation-service';
import { MenuContext } from '../../services/menu-context';
import { Menus } from '../../services/menus';
import { Messages } from '../messages/messages';
import { NavigationPath } from '../../components/resources/view/state/navigation-path';
import { ViewModalLauncher } from '../viewmodal/view-modal-launcher';
import { MsgWithParams } from '../messages/msg-with-params';


export type PopoverMenu = 'none'|'info'|'children';


@Component({
    templateUrl: './resources.html'
})
/**
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 * @author Jan G. Wieners
 * @author Thomas Kleinke
 */
export class ResourcesComponent implements OnDestroy {

    public activePopoverMenu: PopoverMenu = 'none';
    public filterOptions: Array<CategoryForm> = [];
    public additionalSelectedDocuments: Array<FieldDocument> = [];

    private clickEventObservers: Array<any> = [];

    private deselectionSubscription: Subscription;
    private populateDocumentsSubscription: Subscription;
    private changedDocumentFromRemoteSubscription: Subscription;
    private selectViaResourceLinkSubscription: Subscription;


    constructor(route: ActivatedRoute,
                public viewFacade: ViewFacade,
                private routingService: Routing,
                private doceditLauncher: DoceditLauncher,
                private viewModalLauncher: ViewModalLauncher,
                private renderer: Renderer2,
                private messages: Messages,
                private loading: Loading,
                private changeDetectorRef: ChangeDetectorRef,
                private modalService: NgbModal,
                private resourceDeletion: ResourceDeletion,
                private tabManager: TabManager,
                private navigationService: NavigationService,
                private projectConfiguration: ProjectConfiguration,
                private menuService: Menus) {

        routingService.routeParams(route).subscribe(async (params: any) => {
            this.quitGeometryEditing();

            if (params['id']) {
                await this.selectDocumentFromParams(params['id'], params['menu'], params['group']);
            }
        });

        this.initializeClickEventListener();
        this.initializeSubscriptions();

        this.viewFacade.navigationPathNotifications().subscribe((_: any) => {
            this.quitGeometryEditing();
        });

        this.viewFacade.rebuildNavigationPath();
    }


    public isCurrentMode = (mode: string) => (this.viewFacade.getMode() === mode);

    public getQueryString = () => this.viewFacade.getSearchString();

    public getCategoryFilters = () => this.viewFacade.getFilterCategories();

    public isInExtendedSearchMode = () => this.viewFacade.isInExtendedSearchMode();

    public isReady = () => this.viewFacade.isReady();

    public isInTypesManagement = () => this.viewFacade.isInTypesManagement();


    ngOnDestroy() {

        if (this.deselectionSubscription) this.deselectionSubscription.unsubscribe();
        if (this.populateDocumentsSubscription) this.populateDocumentsSubscription.unsubscribe();
        if (this.changedDocumentFromRemoteSubscription) this.changedDocumentFromRemoteSubscription.unsubscribe();
        if (this.selectViaResourceLinkSubscription) this.selectViaResourceLinkSubscription.unsubscribe();
    }


    public listenToClickEvents(): Observable<Event> {

        return Observable.create((observer: any) => {
            this.clickEventObservers.push(observer);
        });
    }


    public async setQueryString(q: string) {

        this.viewFacade.setLimitSearchResults(true);
        await this.viewFacade.setSearchString(q);
    }


    public async setCategoryFilters(categories: string[]|undefined) {

        this.viewFacade.setLimitSearchResults(true);
        await this.viewFacade.setFilterCategories(categories ? categories : []);
    }


    private updateFilterOptions() {

        if (this.viewFacade.isInOverview()) {
            this.filterOptions = this.viewFacade.isInExtendedSearchMode()
                ? this.projectConfiguration.getConcreteFieldCategories()
                    .filter(category => !category.parentCategory)
                : this.projectConfiguration.getOverviewToplevelCategories();
        } else if (this.viewFacade.isInTypesManagement()) {
            this.filterOptions = this.projectConfiguration.getTypeCategories();
        } else {
            this.filterOptions = this.projectConfiguration.getAllowedRelationDomainCategories(
                'isRecordedIn',
                (this.viewFacade.getCurrentOperation() as FieldDocument).resource.category
            );
        }
    }


    public async startEditNewDocument(newDocument: FieldDocument, geometryType: string) {

        if (geometryType === 'none') {
            await this.editDocument(newDocument);
        } else {
            newDocument.resource['geometry'] = <FieldGeometry> { type: geometryType };
            this.viewFacade.addNewDocument(newDocument);
            this.startGeometryEditing();
            this.viewFacade.setMode('map');
        }
    }


    public editDocument(document: Document|undefined,
                        activeGroup?: string): Promise<FieldDocument|undefined> {

        if (!document) throw 'Called edit document with undefined document';

        this.quitGeometryEditing(document);

        return this.doceditLauncher.editDocument(document, activeGroup);
    }


    public editImages(document: Document) {

        this.viewModalLauncher.openImageViewModal(document, 'edit');
    }


    public async moveDocuments(documents: Array<FieldDocument>) {

        this.quitGeometryEditing();
        this.menuService.setContext(MenuContext.MODAL);

        const modalRef = this.modalService.open(MoveModalComponent, { keyboard: false, animation: false });
        modalRef.componentInstance.initialize(documents);

        try {
            const errors: boolean = await modalRef.result;
            await this.viewFacade.deselect();
            await this.viewFacade.rebuildNavigationPath();
            if (errors) {
                await this.viewFacade.populateDocumentList();
            } else {
                await this.routingService.jumpToResource(documents[0]);
            }
            
        } catch (msgWithParams) {
            if (Array.isArray(msgWithParams)) this.messages.add(msgWithParams as MsgWithParams);
            // Otherwise, the move modal has been canceled
        }

        this.menuService.setContext(MenuContext.DEFAULT);
    }


    public async deleteDocument(documents: Array<FieldDocument>) {

        this.quitGeometryEditing();
        this.menuService.setContext(MenuContext.MODAL);

        try {
            await this.resourceDeletion.delete(documents);
            await this.viewFacade.deselect();
            for (const document of documents) {
                await this.tabManager.closeTab('resources', document.resource.id);
                this.viewFacade.removeView(document.resource.id);
            }
            await this.viewFacade.rebuildNavigationPath();
            await this.viewFacade.populateDocumentList();
        } catch (msgWithParams) {
            if (Array.isArray(msgWithParams)) this.messages.add(msgWithParams as MsgWithParams);
            // Otherwise, the delete modal has been canceled.
        }

        this.menuService.setContext(MenuContext.DEFAULT);
    }


    public createGeometry(geometryType: string) {

        (this.viewFacade.getSelectedDocument() as any).resource['geometry'] = { type: geometryType };
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


    public async select(document: FieldDocument) {

        this.quitGeometryEditing();

        if (!document) {
            this.viewFacade.deselect();
        } else {
            await this.viewFacade.setSelectedDocument(document.resource.id, false);
        }
    }


    public isSelected(document: FieldDocument) {

        if (!this.viewFacade.getSelectedDocument()) return false;
        return (this.viewFacade.getSelectedDocument() as FieldDocument).resource.id === document.resource.id;
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
    }


    public async navigatePopoverMenus(direction: 'previous'|'next') {

        const selectedDocument: FieldDocument|undefined = this.viewFacade.getSelectedDocument();
        if (!selectedDocument) return;

        const availablePopoverMenus: string[] = this.getAvailablePopoverMenus(selectedDocument);

        let index = availablePopoverMenus.indexOf(this.activePopoverMenu)
            + (direction === 'next' ? 1 : -1);
        if (index < 0) index = availablePopoverMenus.length - 1;
        if (index >= availablePopoverMenus.length) index = 0;

        await this.openPopoverMenu(availablePopoverMenus[index] as PopoverMenu, selectedDocument);
    }


    public async removeLimit() {

        this.viewFacade.setLimitSearchResults(false);
        await this.viewFacade.populateDocumentList();
    }


    public toggleAdditionalSelected(document: FieldDocument, allowDeselection: boolean) {

        if (this.additionalSelectedDocuments.includes(document)) {
            if (!allowDeselection) return;
            this.additionalSelectedDocuments = this.additionalSelectedDocuments.filter(doc => doc !== document);
        } else {
            this.additionalSelectedDocuments.push(document);
            this.additionalSelectedDocuments = this.additionalSelectedDocuments.slice();
        }
    }


    private async selectDocumentFromParams(id: string, menu: string, group: string|undefined) {

        if (this.viewFacade.getMode() === 'types') {
            await this.viewFacade.moveInto(id, false, true);
        } else {
            await this.viewFacade.setSelectedDocument(id);
        }

        try {
            if (menu === 'edit') {
                await this.editDocument(
                    this.viewFacade.getMode() === 'types'
                        ? NavigationPath.getSelectedSegment(this.viewFacade.getNavigationPath())?.document
                        : this.viewFacade.getSelectedDocument(),
                    group
                );
            } else {
                if (this.viewFacade.getMode() !== 'types') this.activePopoverMenu = 'info';
                await this.viewFacade.setActiveDocumentViewTab(group);
            }
        } catch (e) {
            this.messages.add([M.DATASTORE_ERROR_NOT_FOUND]);
        }
    }


    public quitGeometryEditing(document: Document|undefined = this.viewFacade.getSelectedDocument()) {

        if (this.menuService.getContext() !== MenuContext.GEOMETRY_EDIT) return;

        if (document && document.resource.geometry && !document.resource.geometry.coordinates) {
            delete document.resource.geometry;
        }

        this.menuService.setContext(MenuContext.DEFAULT);
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

        this.selectViaResourceLinkSubscription =
            this.viewFacade.selectViaResourceLinkNotifications().subscribe(document => {
                this.openPopoverMenu('info', document as FieldDocument);
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

        this.menuService.setContext(MenuContext.GEOMETRY_EDIT);
    }
}
