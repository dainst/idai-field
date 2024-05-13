import { ChangeDetectorRef, Component, OnDestroy, Renderer2 } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Observable, Subscription } from 'rxjs';
import { Document, FieldDocument, FieldGeometry, CategoryForm, ProjectConfiguration } from 'idai-field-core';
import { Loading } from '../widgets/loading';
import { Routing } from '../../services/routing';
import { DoceditLauncher } from './service/docedit-launcher';
import { M } from '../messages/m';
import { MoveModalComponent, MoveResult } from '../widgets/move-modal/move-modal.component';
import { AngularUtility } from '../../angular/angular-utility';
import { ResourceDeletion } from './actions/delete/resource-deletion';
import { TabManager } from '../../services/tabs/tab-manager';
import { ResourcesViewMode, ViewFacade } from '../../components/resources/view/view-facade';
import { MenuContext } from '../../services/menu-context';
import { Menus } from '../../services/menus';
import { Messages } from '../messages/messages';
import { NavigationPath } from '../../components/resources/view/state/navigation-path';
import { ViewModalLauncher } from '../viewmodal/view-modal-launcher';
import { MsgWithParams } from '../messages/msg-with-params';
import { QrCodeEditorModalComponent } from './actions/edit-qr-code/qr-code-editor-modal.component';
import { StoragePlaceScanner } from './actions/scan-storage-place/storage-place-scanner';
import { WarningsService } from '../../services/warnings/warnings-service';


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

    public popoverMenuOpened: boolean = false;
    public filterOptions: Array<CategoryForm> = [];
    public additionalSelectedDocuments: Array<FieldDocument> = [];
    public mapUpdateAllowed: boolean = true;

    private clickEventObservers: Array<any> = [];

    private deselectionSubscription: Subscription;
    private populateDocumentsSubscription: Subscription;
    private changedDocumentFromRemoteSubscription: Subscription;
    private selectViaResourceLinkSubscription: Subscription;
    private warningsResolvedSubscription: Subscription;


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
                private projectConfiguration: ProjectConfiguration,
                private menuService: Menus,
                private storagePlaceScanner: StoragePlaceScanner,
                private warningsService: WarningsService) {

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

    public isInGridListView = () => this.viewFacade.isInGridListView();

    public scanStoragePlace = (documents: Array<FieldDocument>) =>
        this.storagePlaceScanner.scanStoragePlace(documents);


    ngOnDestroy() {

        if (this.deselectionSubscription) this.deselectionSubscription.unsubscribe();
        if (this.populateDocumentsSubscription) this.populateDocumentsSubscription.unsubscribe();
        if (this.changedDocumentFromRemoteSubscription) this.changedDocumentFromRemoteSubscription.unsubscribe();
        if (this.selectViaResourceLinkSubscription) this.selectViaResourceLinkSubscription.unsubscribe();
        if (this.warningsResolvedSubscription) this.warningsResolvedSubscription.unsubscribe();
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
                ? this.projectConfiguration.getFieldCategories()
                    .filter(category => !category.parentCategory)
                : this.projectConfiguration.getOverviewSupercategories();
        } else if (this.viewFacade.isInTypesManagement()) {
            this.filterOptions = this.projectConfiguration.getTypeManagementSupercategories();
        } else if (this.viewFacade.isInInventoryManagement()) {
            this.filterOptions = this.projectConfiguration.getInventorySupercategories();
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


    public async editDocument(document: Document|undefined,
                              activeGroup?: string): Promise<FieldDocument|undefined> {

        if (!document) throw 'Called edit document with undefined document';

        this.quitGeometryEditing(document);
        
        this.mapUpdateAllowed = false;

        try {
            return await this.doceditLauncher.editDocument(document, activeGroup);
        } catch (err) {
            throw err;
        } finally {
            this.mapUpdateAllowed = true;
        }
    }


    public editImages(document: Document) {

        this.viewModalLauncher.openImageViewModal(document, 'edit');
    }


    public async editQRCode(document: Document) {

        try {
            this.menuService.setContext(MenuContext.QR_CODE_EDITOR);

            const modalRef: NgbModalRef = this.modalService.open(
                QrCodeEditorModalComponent,
                { animation: false, backdrop: 'static', keyboard: false }
            );
            modalRef.componentInstance.document = document;
            await modalRef.componentInstance.initialize();
            AngularUtility.blurActiveElement();
            await modalRef.result;
        } catch (err) {
            console.error(err);
        } finally {
            this.menuService.setContext(MenuContext.DEFAULT);
        }
    }


    public async moveDocuments(documents: Array<FieldDocument>) {

        this.quitGeometryEditing();
        this.menuService.setContext(MenuContext.MODAL);

        const modalRef: NgbModalRef = this.modalService.open(
            MoveModalComponent,
            { keyboard: false, animation: false }
        );
        modalRef.componentInstance.initialize(documents);

        try {
            const result: MoveResult = await modalRef.result;
            await this.viewFacade.deselect();
            await this.viewFacade.rebuildNavigationPath();
            if (result.success) {
                await this.jumpToNewParentAfterMovingResource(result.newParent, documents);
            } else {
                await this.viewFacade.populateDocumentList();
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
        } else if (document !== this.viewFacade.getSelectedDocument()){
            await this.viewFacade.setSelectedDocument(document.resource.id, false);
        }
    }


    public isSelected(document: FieldDocument) {

        if (!this.viewFacade.getSelectedDocument()) return false;
        return (this.viewFacade.getSelectedDocument() as FieldDocument).resource.id === document.resource.id;
    }


    public async togglePopoverMenu() {

        this.popoverMenuOpened = !this.popoverMenuOpened;
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

        if (this.viewFacade.getMode() === 'grid') {
            await this.viewFacade.moveInto(id, false, true);
        } else {
            await this.viewFacade.setSelectedDocument(id);
        }

        try {
            if (menu === 'edit') {
                await this.editDocument(
                    this.viewFacade.getMode() === 'grid'
                        ? NavigationPath.getSelectedSegment(this.viewFacade.getNavigationPath())?.document
                        : this.viewFacade.getSelectedDocument(),
                    group
                );
            } else {
                if (this.viewFacade.getMode() !== 'grid') this.popoverMenuOpened = true;
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
            this.viewFacade.selectViaResourceLinkNotifications().subscribe(async document => {
                this.popoverMenuOpened = true;
                if (!this.isSelected(document as FieldDocument)) {
                    await this.select(document as FieldDocument);
                }
            });
        
        this.warningsResolvedSubscription =
            this.warningsService.warningsResolvedNotifications().subscribe(async () => {
                await this.viewFacade.populateDocumentList();
            });
    }


    private startGeometryEditing() {

        this.menuService.setContext(MenuContext.GEOMETRY_EDIT);
    }


    private async jumpToNewParentAfterMovingResource(newParent: FieldDocument, movedDocuments: Array<FieldDocument>) {

        if (this.viewFacade.isInGridListView()) {
            if (newParent.resource.category === 'InventoryRegister') {
                this.viewFacade.moveInto(undefined, false, true);
            } else {
                await this.routingService.jumpToResource(newParent, false);
            }
        } else {
            await this.routingService.jumpToResource(movedDocuments[0], false);
        }
    }
}
