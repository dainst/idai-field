import {Component, Input} from '@angular/core';
import {isEmpty} from 'tsfun';
import {ProjectConfiguration, FieldDocument} from 'idai-components-2';
import {ResourcesComponent} from '../../resources.component';
import {Loading} from '../../../../widgets/loading';
import {ViewFacade} from '../../view/view-facade';
import {NavigationService} from '../../navigation/navigation-service';
import {BaseList} from '../../base-list';
import {ResourcesMapComponent} from '../resources-map.component';
import {RoutingService} from '../../../routing-service';
import {FieldReadDatastore} from '../../../../core/datastore/field/field-read-datastore';


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
    public children: Array<FieldDocument> = [];


    constructor(resourcesComponent: ResourcesComponent,
                public viewFacade: ViewFacade,
                loading: Loading,
                private navigationService: NavigationService,
                private resourcesMapComponent: ResourcesMapComponent,
                private fieldDatastore: FieldReadDatastore,
                private projectConfiguration: ProjectConfiguration,
                private routingService: RoutingService) {

        super(resourcesComponent, viewFacade, loading);
        this.navigationService.moveIntoNotifications().subscribe(async () => {
            await this.viewFacade.deselect();
            this.closePopover();
        });
    }


    public jumpToMatrix = (document: FieldDocument) => this.navigationService.jumpToMatrix(document);

    public showMoveIntoOption = (document: FieldDocument) =>
        this.navigationService.showMoveIntoOption(document);

    public showJumpToViewOption = (document: FieldDocument) =>
        this.navigationService.showJumpToViewOption(document);

    public openContextMenu = (event: MouseEvent, document: FieldDocument) =>
        this.resourcesMapComponent.openContextMenu(event, document);

    public closeContextMenu = () => this.resourcesMapComponent.closeContextMenu();


    public async toggleInfoMenu(document: FieldDocument) {

        if (this.activePopoverMenu === 'info' && this.isSelected(document)) {
            this.closePopover();
        } else {
            await this.openInfoMenu(document);
        }
    };


    public async toggleRelationsMenu(document: FieldDocument) {

        if (this.activePopoverMenu === 'relations' && this.isSelected(document)) {
            this.closePopover();
        } else {
            await this.openRelationsMenu(document);
        }
    };


    public async toggleChildrenMenu(document: FieldDocument) {

        if (this.activePopoverMenu === 'children' && this.isSelected(document)) {
            this.closePopover();
        } else {
            await this.openChildrenMenu(document);
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

        return ((!popoverMenu && this.activePopoverMenu !== 'none') || this.activePopoverMenu === popoverMenu)
            && (!document || this.isSelected(document));
    }


    public async getChildren(document: FieldDocument) {

        // TODO remove viewFacade.getChildrenCount

        if (!document) return [];
        const children = await this.fieldDatastore.find({constraints: {
                'liesWithin:contain' : document.resource.id
            }});
        this.children = children.documents;
    }


    public jumpToView(document: FieldDocument) {

        this.closePopover();
        this.navigationService.jumpToView(document);
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


    public async jumpToResource(documentToSelect: FieldDocument) {

        this.closePopover();
        await this.routingService.jumpToResource(documentToSelect, 'relations');
        this.resourcesComponent.setScrollTarget(documentToSelect);
    }


    public async moveIntoAndSelect(document: FieldDocument) {

        this.closePopover();
        const selectedDocument = this.viewFacade.getSelectedDocument();
        if (!selectedDocument) return;
        await this.routingService.jumpToResource(selectedDocument);
        await this.viewFacade.setSelectedDocument(document.resource.id);
    }


    public closePopover() {

        this.activePopoverMenu = 'none';
        this.highlightedDocument = undefined;
        this.children = [];
    };


    public async openChildCollection() {

        await this.viewFacade.moveInto(this.viewFacade.getSelectedDocument());
        await this.viewFacade.deselect();
        this.closePopover();
    }


    public async select(document: FieldDocument, autoScroll: boolean = false) {

        this.resourcesComponent.isEditingGeometry = false;

        if (!document) {
            this.viewFacade.deselect();
        } else {
            await this.viewFacade.setSelectedDocument(document.resource.id, false);
        }

        if (autoScroll) this.resourcesComponent.setScrollTarget(document);
    }


    private async openChildrenMenu(document: FieldDocument) {

        await this.select(document);
        await this.getChildren(document);

        this.activePopoverMenu = 'children';
    }


    private async openInfoMenu(document: FieldDocument) {

        this.children = [];

        if (!this.isSelected(document)) await this.select(document);

        this.activePopoverMenu = 'info';
    }


    private async openRelationsMenu(document: FieldDocument) {

        this.children = [];

        if (!this.isSelected(document)) await this.select(document);

        this.activePopoverMenu = 'relations';
    }
}