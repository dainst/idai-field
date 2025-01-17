import { AfterViewInit, Component, ElementRef, ViewChild, Input, OnChanges } from '@angular/core';
import { to } from 'tsfun';
import { FieldDocument } from 'idai-field-core';
import { ResourcesComponent } from '../../resources.component';
import { Loading } from '../../../widgets/loading';
import { BaseList } from '../../base-list';
import { ResourcesContextMenuAction } from '../../widgets/resources-context-menu.component';
import { ViewFacade } from '../../../../components/resources/view/view-facade';
import { NavigationService } from '../../navigation/navigation-service';
import { ResourcesContextMenu } from '../../widgets/resources-context-menu';
import { MenuContext } from '../../../../services/menu-context';
import { Menus } from '../../../../services/menus';
import { ComponentHelpers } from '../../../component-helpers';
import { WarningsService } from '../../../../services/warnings/warnings-service';


@Component({
    selector: 'sidebar-list',
    templateUrl: './sidebar-list.html',
    host: {
        '(window:contextmenu)': 'handleClick($event, true)'
    },
    standalone: false
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class SidebarListComponent extends BaseList implements AfterViewInit, OnChanges {

    @Input() selectedDocument: FieldDocument;

    @ViewChild('sidebar', { static: false }) sidebarElement: ElementRef;

    public contextMenu: ResourcesContextMenu = new ResourcesContextMenu();

    public readonly itemSize: number = 59;

    private lastSelectedDocument: FieldDocument|undefined;


    constructor(private navigationService: NavigationService,
                private warningsService: WarningsService,
                resourcesComponent: ResourcesComponent,
                loading: Loading,
                viewFacade: ViewFacade,
                menuService: Menus) {

        super(resourcesComponent, viewFacade, loading, menuService);

        this.navigationService.moveIntoNotifications().subscribe(async () => {
            await this.viewFacade.deselect();
            this.resourcesComponent.popoverMenuOpened = false;
        });

        resourcesComponent.listenToClickEvents().subscribe(event => this.handleClick(event));

        this.viewFacade.navigationPathNotifications().subscribe(() => {
            this.contextMenu.close();
            this.sidebarElement.nativeElement.focus();
        });
    }


    ngAfterViewInit() {

        this.sidebarElement.nativeElement.focus();
    }


    ngOnChanges() {

        this.resourcesComponent.additionalSelectedDocuments = [];
        this.scrollTo(this.selectedDocument, this.isScrolledToBottomElement());
        this.lastSelectedDocument = this.selectedDocument;
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            await this.viewFacade.navigateDocumentList(event.key === 'ArrowUp' ? 'previous' : 'next');
            event.preventDefault();
        }

        if (event.key === 'Enter') {
            await this.openChildCollection();
            event.preventDefault();
        }

        if (event.key === 'Backspace') {
            await this.goToUpperHierarchyLevel();
            event.preventDefault();
        }
    }


    public async select(document: FieldDocument, event: MouseEvent, allowDeselection: boolean = true) {

        if (!this.lastSelectedDocument) this.lastSelectedDocument = this.selectedDocument;

        if (event.shiftKey && this.lastSelectedDocument) {
            this.selectBetween(this.lastSelectedDocument, document);
            this.lastSelectedDocument = document;
            this.resourcesComponent.popoverMenuOpened = false;
        } else if ((event.metaKey || event.ctrlKey) && this.selectedDocument && document !== this.selectedDocument) {
            this.resourcesComponent.toggleAdditionalSelected(document, allowDeselection);
            this.lastSelectedDocument = document;
            this.resourcesComponent.popoverMenuOpened = false;
        } else if (!event.metaKey && !event.ctrlKey && (allowDeselection || !this.isPartOfSelection(document))) {
            this.resourcesComponent.additionalSelectedDocuments = [];
            await this.resourcesComponent.select(document);
            if (event.type === 'click') this.resourcesComponent.popoverMenuOpened = true;
        }
    }


    public getSelection(): Array<FieldDocument> {

        return this.selectedDocument
            ? [this.selectedDocument].concat(this.resourcesComponent.additionalSelectedDocuments)
            : [];
    }


    public async editDocument(document: FieldDocument) {

        await this.resourcesComponent.editDocument(document);
    }


    public async performContextMenuAction(action: ResourcesContextMenuAction) {

        if (this.resourcesComponent.popoverMenuOpened &&
                ['edit-geometry', 'create-polygon', 'create-line-string', 'create-point'].includes(action)) {
            this.resourcesComponent.popoverMenuOpened = false;
        }

        if (!this.selectedDocument) return;
        this.contextMenu.close();

        switch (action) {
            case 'edit':
                await this.resourcesComponent.editDocument(this.selectedDocument);
                break;
            case 'move':
                await this.resourcesComponent.moveDocuments(this.contextMenu.documents as Array<FieldDocument>);
                break;
            case 'delete':
                await this.resourcesComponent.deleteDocument(this.contextMenu.documents as Array<FieldDocument>);
                break;
            case 'warnings':
                await this.warningsService.openModal(this.selectedDocument);
                break;
            case 'edit-images':
                await this.resourcesComponent.editImages(this.selectedDocument);
                break;
            case 'edit-qr-code':
                await this.resourcesComponent.editQRCode(this.selectedDocument);
                break;
            case 'scan-storage-place':
                await this.resourcesComponent.scanStoragePlace(this.contextMenu.documents as Array<FieldDocument>);
                break;
            case 'edit-geometry':
                await this.viewFacade.setSelectedDocument(this.selectedDocument.resource.id);
                this.menuService.setContext(MenuContext.GEOMETRY_EDIT);
                break;
            case 'create-polygon':
                await this.viewFacade.setSelectedDocument(this.selectedDocument.resource.id);
                this.resourcesComponent.createGeometry('Polygon');
                break;
            case 'create-line-string':
                await this.viewFacade.setSelectedDocument(this.selectedDocument.resource.id);
                this.resourcesComponent.createGeometry('LineString');
                break;
            case 'create-point':
                await this.viewFacade.setSelectedDocument(this.selectedDocument.resource.id);
                this.resourcesComponent.createGeometry('Point');
                break;
        }
    }


    public handleClick(event: any, rightClick: boolean = false) {

        if (!this.contextMenu.position) return;

        if (!ComponentHelpers.isInside(event.target, target => target.id === 'context-menu'
                || rightClick && target.id && target.id.startsWith('resource-'))) {
            this.contextMenu.close();
        }
    }


    public trackDocument = (_: number, document: FieldDocument) => document.resource.id;


    private selectBetween(document1: FieldDocument, document2: FieldDocument) {

        const documents = this.viewFacade.getDocuments();
        const index1 = documents.indexOf(document1);
        const index2 = documents.indexOf(document2);

        for (let i = Math.min(index1, index2); i <= Math.max(index1, index2); i++) {
            const document = documents[i];
            if (this.selectedDocument !== document
                    && !this.resourcesComponent.additionalSelectedDocuments.includes(document)) {
                this.resourcesComponent.additionalSelectedDocuments.push(document);
            }
        }
        this.resourcesComponent.additionalSelectedDocuments
            = this.resourcesComponent.additionalSelectedDocuments.slice();
    }


    private isPartOfSelection(document: FieldDocument): boolean {

        return document === this.selectedDocument
            || this.resourcesComponent.additionalSelectedDocuments.includes(document);
    }


    private async openChildCollection() {

        const selectedDocument = this.selectedDocument;
        if (selectedDocument) await this.navigationService.moveInto(selectedDocument);
    }


    private async goToUpperHierarchyLevel() {

        const navigationPath = this.viewFacade.getNavigationPath();
        if (!navigationPath.selectedSegmentId || navigationPath.segments.length === 0) return;

        const newSegmentIndex: number = navigationPath.segments
            .map(to(['document', 'resource', 'id']))
            .indexOf(navigationPath.selectedSegmentId) - 1;

        await this.navigationService.moveInto(
            newSegmentIndex < 0
                ? undefined
                : navigationPath.segments[newSegmentIndex].document
        );
    }


    private isScrolledToBottomElement(): boolean {

        if (!this.lastSelectedDocument || !this.selectedDocument) return false;

        const documents: Array<FieldDocument> = this.viewFacade.getDocuments();
        
        const lastSelectedDocumentIndex: number = documents.findIndex(document => {
            return document.resource.id === this.lastSelectedDocument.resource.id; }
        );
        const selectedDocumentIndex: number = documents.findIndex(document => {
            return document.resource.id === this.selectedDocument.resource.id; }
        );

        const indexDifference: number = selectedDocumentIndex - lastSelectedDocumentIndex;
        const numberOfDisplayedItems: number = Math.floor(this.scrollViewport.getViewportSize() / this.itemSize);

        return indexDifference > 0 && indexDifference <= numberOfDisplayedItems;
    }
}
