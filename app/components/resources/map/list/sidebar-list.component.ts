import {Component} from '@angular/core';
import {Document, FieldDocument} from 'idai-components-2';
import {ResourcesComponent} from '../../resources.component';
import {Loading} from '../../../../widgets/loading';
import {ViewFacade} from '../../view/view-facade';
import {NavigationService} from '../../navigation/navigation-service';
import {BaseList} from '../../base-list';
import {PopoverMenu, ResourcesMapComponent} from '../resources-map.component';
import {TypeUtility} from '../../../../core/model/type-utility';
import {RoutingService} from '../../../routing-service';
import {ContextMenuAction} from '../context-menu.component';


@Component({
    selector: 'sidebar-list',
    moduleId: module.id,
    templateUrl: './sidebar-list.html',
    host: { '(window:contextmenu)': 'handleClick($event, true)' }
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */

export class SidebarListComponent extends BaseList {

    public contextMenuPosition: { x: number, y: number }|undefined;
    public contextMenuDocument: FieldDocument|undefined;

    public highlightedDocument: FieldDocument|undefined = undefined;
    public selectedDocumentThumbnailUrl: string|undefined;

    constructor(resourcesComponent: ResourcesComponent,
                loading: Loading,
                public viewFacade: ViewFacade,
                public typeUtility: TypeUtility,
                private navigationService: NavigationService,
                private resourcesMapComponent: ResourcesMapComponent,
                private routingService: RoutingService) {

        super(resourcesComponent, viewFacade, loading);
        this.navigationService.moveIntoNotifications().subscribe(async () => {
            await this.viewFacade.deselect();
            this.closePopover();
        });

        resourcesComponent.listenToClickEvents().subscribe(event => this.handleClick(event));

        this.viewFacade.navigationPathNotifications().subscribe((_: any) => {
            this.closeContextMenu();
        });
    }


    public getExpandAllGroups = () => this.viewFacade.getExpandAllGroups();

    public toggleExpandAllGroups = () => this.viewFacade.toggleExpandAllGroups();

    public disableExpandAllGroups = () => !this.getExpandAllGroups() || this.toggleExpandAllGroups();

    public hasThumbnail = (document: FieldDocument): boolean => Document.hasRelations(document, 'isDepictedIn');


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'ArrowUp') {
            await this.viewFacade.navigateDocumentList('previous');
            event.preventDefault();
            this.resourcesComponent.setScrollTarget(this.viewFacade.getSelectedDocument());
        } else if (event.key === 'ArrowDown') {
            await this.viewFacade.navigateDocumentList('next');
            event.preventDefault();
            this.resourcesComponent.setScrollTarget(this.viewFacade.getSelectedDocument());
        }
    }


    public async editDocument(document: FieldDocument) {

        await this.resourcesComponent.editDocument(document);
    }


    public isScrollbarVisible(element: HTMLElement): boolean {

        return element.scrollHeight > element.clientHeight;
    }


    public async togglePopoverMenu(popoverMenu: PopoverMenu, document: FieldDocument) {

        if (this.isPopoverMenuOpened(popoverMenu, document) || popoverMenu === 'none') {
            this.closePopover();
        } else {
            await this.openPopoverMenu(popoverMenu, document);
        }
    }


    public isSelected(document: FieldDocument) {

        if (!this.viewFacade.getSelectedDocument()) return false;
        return (this.viewFacade.getSelectedDocument() as FieldDocument).resource.id === document.resource.id;
    }


    public highlightDocument(document: FieldDocument) {

        this.highlightedDocument = document;
    };


    public isHighlighted(document: FieldDocument): boolean {

        if (!this.highlightedDocument) return false;
        return this.highlightedDocument.resource.id === document.resource.id;
    }


    public isPopoverMenuOpened(popoverMenu?: PopoverMenu, document?: FieldDocument): boolean {

        return this.viewFacade.getSelectedDocument() !== undefined
            && ((!popoverMenu && this.resourcesMapComponent.activePopoverMenu !== 'none')
                || this.resourcesMapComponent.activePopoverMenu === popoverMenu)
            && (!document || this.isSelected(document));
    }


    public closePopover() {

        this.resourcesMapComponent.activePopoverMenu = 'none';
        this.highlightedDocument = undefined;
        this.selectedDocumentThumbnailUrl = undefined;
    };


    public async select(document: FieldDocument, autoScroll: boolean = false) {

        this.resourcesComponent.isEditingGeometry = false;
        this.selectedDocumentThumbnailUrl = undefined;

        if (!document) {
            this.viewFacade.deselect();
        } else {
            await this.viewFacade.setSelectedDocument(document.resource.id, false);
        }

        if (autoScroll) this.resourcesComponent.setScrollTarget(document);
    }


    public async jumpToResource(document: FieldDocument) {

        await this.routingService.jumpToResource(document);
        this.resourcesComponent.setScrollTarget(document);
    }


    public openContextMenu(event: MouseEvent, document: FieldDocument) {

        if (!document.resource.id) return this.closeContextMenu();

        this.contextMenuPosition = { x: event.clientX, y: event.clientY };
        this.contextMenuDocument = document;
    }


    public closeContextMenu() {

        this.contextMenuPosition = undefined;
        this.contextMenuDocument = undefined;
    }


    public async performContextMenuAction(action: ContextMenuAction) {

        if (this.isPopoverMenuOpened() &&
            ['edit-geometry', 'create-polygon',
                'create-line-string', 'create-point'].includes(action)) {

            this.closePopover();
        }

        if (!this.contextMenuDocument) return;
        const document: FieldDocument = this.contextMenuDocument;

        this.closeContextMenu();

        switch (action) {
            case 'edit':
                await this.resourcesComponent.editDocument(document);
                break;
            case 'move':
                await this.resourcesComponent.moveDocument(document);
                break;
            case 'delete':
                await this.resourcesComponent.deleteDocument(document);
                break;
            case 'edit-geometry':
                await this.viewFacade.setSelectedDocument(document.resource.id);
                this.resourcesComponent.isEditingGeometry = true;
                break;
            case 'create-polygon':
                await this.viewFacade.setSelectedDocument(document.resource.id);
                this.resourcesComponent.createGeometry('Polygon');
                break;
            case 'create-line-string':
                await this.viewFacade.setSelectedDocument(document.resource.id);
                this.resourcesComponent.createGeometry('LineString');
                break;
            case 'create-point':
                await this.viewFacade.setSelectedDocument(document.resource.id);
                this.resourcesComponent.createGeometry('Point');
                break;
        }
    }


    public handleClick(event: any, rightClick: boolean = false) {

        if (!this.contextMenuPosition) return;

        let target = event.target;
        let inside: boolean = false;

        do {
            if (target.id === 'context-menu'
                || (rightClick && target.id && target.id.startsWith('resource-'))) {
                inside = true;
                break;
            }
            target = target.parentNode;
        } while (target);

        if (!inside) this.closeContextMenu();
    }


    private async openPopoverMenu(popoverMenu: PopoverMenu, document: FieldDocument) {

        this.resourcesMapComponent.activePopoverMenu = popoverMenu;

        if (!this.isSelected(document)) await this.select(document);
    }
}