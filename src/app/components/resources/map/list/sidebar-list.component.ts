import {AfterViewInit, Component, ElementRef, ViewChild, Input} from '@angular/core';
import {to} from 'tsfun';
import {FieldDocument} from 'idai-components-2';
import {ResourcesComponent} from '../../resources.component';
import {Loading} from '../../../widgets/loading';
import {BaseList} from '../../base-list';
import {ProjectCategoriesUtility} from '../../../../core/configuration/project-categories-utility';
import {ContextMenuAction} from '../../widgets/context-menu.component';
import {ViewFacade} from '../../../../core/resources/view/view-facade';
import {NavigationPath} from '../../../../core/resources/view/state/navigation-path';
import {NavigationService} from '../../../../core/resources/navigation/navigation-service';
import {ContextMenu} from '../../widgets/context-menu';
import {MenuService} from '../../../menu-service';


@Component({
    selector: 'sidebar-list',
    templateUrl: './sidebar-list.html',
    host: { '(window:contextmenu)': 'handleClick($event, true)' }
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class SidebarListComponent extends BaseList implements AfterViewInit {

    public contextMenu: ContextMenu = new ContextMenu();

    @Input() selectedDocument: FieldDocument;

    @ViewChild('sidebar', { static: false }) sidebarElement: ElementRef;


    constructor(resourcesComponent: ResourcesComponent,
                loading: Loading,
                public viewFacade: ViewFacade,
                public projectCategories: ProjectCategoriesUtility,
                private navigationService: NavigationService) {

        super(resourcesComponent, viewFacade, loading);

        this.navigationService.moveIntoNotifications().subscribe(async () => {
            await this.viewFacade.deselect();
            this.resourcesComponent.closePopover();
        });

        resourcesComponent.listenToClickEvents().subscribe(event => this.handleClick(event));

        this.viewFacade.navigationPathNotifications().subscribe(() => {
            this.contextMenu.close();
            this.sidebarElement.nativeElement.focus();
        });
    }


    public select = (document: FieldDocument) => this.resourcesComponent.select(document);


    ngAfterViewInit() {

        this.sidebarElement.nativeElement.focus();
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            await this.viewFacade.navigateDocumentList(event.key === 'ArrowUp' ? 'previous' : 'next');
            event.preventDefault();
            this.resourcesComponent.setScrollTarget(this.selectedDocument);
        }

        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            await this.resourcesComponent
                .navigatePopoverMenus(event.key === 'ArrowLeft' ? 'previous' : 'next');
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


    public async editDocument(document: FieldDocument) {

        await this.resourcesComponent.editDocument(document);
    }


    public async performContextMenuAction(action: ContextMenuAction) {

        if (this.resourcesComponent.isPopoverMenuOpened() &&
            ['edit-geometry', 'create-polygon',
                'create-line-string', 'create-point'].includes(action)) {

            this.resourcesComponent.closePopover();
        }

        if (!this.contextMenu.document) return;
        const document: FieldDocument = this.contextMenu.document;

        this.contextMenu.close();

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
                MenuService.setContext('geometryedit');
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

        if (!this.contextMenu.position) return;

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

        if (!inside) this.contextMenu.close();
    }


    public trackDocument = (index: number, item: FieldDocument) => item.resource.id;


    private async openChildCollection() {

        const selectedDocument: FieldDocument|undefined = this.selectedDocument;
        if (selectedDocument) await this.navigationService.moveInto(selectedDocument);
    }


    private async goToUpperHierarchyLevel() {

        const navigationPath: NavigationPath = this.viewFacade.getNavigationPath();
        if (!navigationPath.selectedSegmentId || navigationPath.segments.length === 0) return;

        const newSegmentIndex: number = navigationPath.segments
            .map(to('document.resource.id'))
            .indexOf(navigationPath.selectedSegmentId) - 1;

        await this.navigationService.moveInto(
            newSegmentIndex < 0
                ? undefined
                : navigationPath.segments[newSegmentIndex].document
        );
    }
}
