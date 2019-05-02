import {Component, Input} from '@angular/core';
import {isEmpty} from 'tsfun';
import {FieldDocument, ProjectConfiguration} from 'idai-components-2';
import {ResourcesComponent} from '../../resources.component';
import {Loading} from '../../../../widgets/loading';
import {ViewFacade} from '../../view/view-facade';
import {NavigationService} from '../../navigation/navigation-service';
import {BaseList} from '../../base-list';
import {ResourcesMapComponent} from '../resources-map.component';
import {RoutingService} from '../../../routing-service';
import {FieldReadDatastore} from '../../../../core/datastore/field/field-read-datastore';
import {Imagestore} from '../../../../core/imagestore/imagestore';
import {TypeUtility} from '../../../../core/model/type-utility';


type PopoverMenu = 'none'|'info'|'relations'|'children';


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

    @Input() activeTab: string;

    public relationsToHide: string[] = ['isRecordedIn', 'liesWithin'];
    public highlightedDocument: FieldDocument|undefined = undefined;
    public activePopoverMenu: PopoverMenu = 'none';
    public selectedDocumentThumbnailUrl: string|undefined;


    constructor(resourcesComponent: ResourcesComponent,
                public viewFacade: ViewFacade,
                loading: Loading,
                private navigationService: NavigationService, // TODO remove reference, since sidebar-list-button-group gets it
                private resourcesMapComponent: ResourcesMapComponent,
                private fieldDatastore: FieldReadDatastore,
                private projectConfiguration: ProjectConfiguration,
                private routingService: RoutingService,
                private imagestore: Imagestore,
                public typeUtility: TypeUtility) {

        super(resourcesComponent, viewFacade, loading);
        this.navigationService.moveIntoNotifications().subscribe(async () => {
            await this.viewFacade.deselect();
            this.closePopover();
        });
    }


    // TODO refactor - make consistent across usages
    // public showMoveIntoOption = (document: FieldDocument) =>
    //     this.navigationService.showMoveIntoOption(document);



    public openContextMenu = (event: MouseEvent, document: FieldDocument) =>
        this.resourcesMapComponent.openContextMenu(event, document);

    public closeContextMenu = () => this.resourcesMapComponent.closeContextMenu();


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
            && ((!popoverMenu && this.activePopoverMenu !== 'none') || this.activePopoverMenu === popoverMenu)
            && (!document || this.isSelected(document));
    }


    public hasVisibleRelations(document: FieldDocument|undefined) {

        const selectedDoc = document;
        if (!selectedDoc) return false;

        const relations: any = selectedDoc.resource.relations;
        if (isEmpty(relations)) return false;

        return Object.keys(relations)
            .filter(name => {
                return this.projectConfiguration.isVisibleRelation(name, selectedDoc.resource.type)
                    && !this.relationsToHide.includes(name)
                    && relations[name].length > 0;
            })
            .length > 0;
    }


    public async jumpToResource(documentToSelect: FieldDocument) { // TODO move to sidebarlistbuttongroup

        this.closePopover();
        await this.routingService.jumpToResource(documentToSelect);
        this.resourcesComponent.setScrollTarget(documentToSelect);
    }


    public closePopover() {

        this.activePopoverMenu = 'none';
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


    private async openPopoverMenu(popoverMenu: PopoverMenu, document: FieldDocument) {

        this.activePopoverMenu = popoverMenu;

        if (!this.isSelected(document)) await this.select(document);
    }
}