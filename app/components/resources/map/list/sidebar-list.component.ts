import {Component} from '@angular/core';
import {FieldDocument} from 'idai-components-2';
import {ResourcesComponent} from '../../resources.component';
import {Loading} from '../../../../widgets/loading';
import {ViewFacade} from '../../view/view-facade';
import {NavigationService} from '../../navigation/navigation-service';
import {BaseList} from '../../base-list';
import {PopoverMenu, ResourcesMapComponent} from '../resources-map.component';
import {TypeUtility} from '../../../../core/model/type-utility';
import {RoutingService} from '../../../routing-service';


@Component({
    selector: 'sidebar-list',
    moduleId: module.id,
    templateUrl: './sidebar-list.html'
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */

export class SidebarListComponent extends BaseList {

    public relationsToHide: string[] = ['isRecordedIn', 'liesWithin'];
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
    }


    public openContextMenu = (event: MouseEvent, document: FieldDocument) =>
        this.resourcesMapComponent.openContextMenu(event, document);

    public closeContextMenu = () => this.resourcesMapComponent.closeContextMenu();


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


    private async openPopoverMenu(popoverMenu: PopoverMenu, document: FieldDocument) {

        this.resourcesMapComponent.activePopoverMenu = popoverMenu;

        if (!this.isSelected(document)) await this.select(document);
    }
}