import {Component, Input} from '@angular/core';
import {ResourcesComponent} from '../../resources.component';
import {ProjectConfiguration, FieldDocument} from 'idai-components-2';
import {Loading} from '../../../../widgets/loading';
import {ViewFacade} from '../../view/view-facade';
import {NavigationService} from '../../navigation/navigation-service';
import {BaseList} from '../../base-list';
import {ResourcesMapComponent} from '../resources-map.component';
import {isEmpty} from 'tsfun';
import {RoutingService} from '../../../routing-service';
import {FieldReadDatastore} from '../../../../core/datastore/field/field-read-datastore';


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

    public listPopoverOpened = false;
    public highlightedDocument: FieldDocument|undefined = undefined;

    public relationsMenuOpened = false;
    public childrenMenuOpened = false;
    public infoMenuOpened = false;

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
            this.closeListPopover();
        });
    }


    public jumpToMatrix = (document: FieldDocument) => this.navigationService.jumpToMatrix(document);

    public showMoveIntoOption = (document: FieldDocument) =>
        this.navigationService.showMoveIntoOption(document);

    public showJumpToViewOption = (document: FieldDocument) =>
        this.navigationService.showJumpToViewOption(document);

    public openContextMenu = (event: MouseEvent, document: FieldDocument) =>
        this.resourcesMapComponent.openContextMenu(event, document);


    public async toggleInfoMenu(document: FieldDocument) {

        if (this.infoMenuOpened && this.isSelected(document)) {

            this.infoMenuOpened = false;
            this.listPopoverOpened = false;
        } else {

            this.childrenMenuOpened = false;
            this.children = [];
            this.relationsMenuOpened = false;

            if (!this.isSelected(document)) await this.select(document);

            this.infoMenuOpened = true;
            this.listPopoverOpened = true;
        }
    };



    public async toggleRelationsMenu(document: FieldDocument) {

        if (this.relationsMenuOpened && this.isSelected(document)) {

            this.relationsMenuOpened = false;
            this.listPopoverOpened = false;
        } else {

            this.childrenMenuOpened = false;
            this.children = [];
            this.infoMenuOpened = false;

            if (!this.isSelected(document)) await this.select(document);

            this.relationsMenuOpened = true;
            this.listPopoverOpened = true;
        }
    };


    public async toggleChildrenMenu(document: FieldDocument) {

        if (this.childrenMenuOpened && this.isSelected(document)) {

            this.childrenMenuOpened = false;
            this.listPopoverOpened = false;
        } else {

            this.relationsMenuOpened = false;
            this.infoMenuOpened = false;

            if (!this.isSelected(document) || this.children.length === 0) {

                const currentParent = this.viewFacade.getNavigationPath()
                    .segments.find((segment) =>
                        segment.document.resource.id === this.viewFacade.getNavigationPath().selectedSegmentId);

                if (currentParent) {
                    await this.viewFacade.moveInto(currentParent.document);
                } else {
                    await this.viewFacade.moveInto(undefined);
                }
                await this.select(document);
                await this.getChildren(document);
            }

            this.listPopoverOpened = true;
            this.childrenMenuOpened = true;
        }
    }


    private isSelected(document: FieldDocument) {

        if (!this.viewFacade.getSelectedDocument()) return false;
        return (this.viewFacade.getSelectedDocument() as FieldDocument).resource.id === document.resource.id;
    }


    public highlightDocument(document: FieldDocument) {

        this.highlightedDocument = document;
    };


    public isHighlighted(document: FieldDocument) {

        if (!this.highlightedDocument) return false;
        return this.highlightedDocument.resource.id === document.resource.id;
    }


    public isRelationsOpened(document: FieldDocument) {

        if (!this.relationsMenuOpened) return false;
        return this.isSelected(document);
    }


    public isChildrenOpened(document: FieldDocument) {

        if (!this.childrenMenuOpened) return false;
        return this.isSelected(document);
    }


    public isInfoOpened(document: FieldDocument) {

        if (!this.infoMenuOpened) return false;
        return this.isSelected(document);
    }


    public closeContextMenu = () => this.resourcesMapComponent.closeContextMenu();

    public closeRelationsMenu = () => this.resourcesMapComponent.closeRelationsMenu();


    public async getChildren(document: FieldDocument) {

        // TODO remove viewFacade.getChildrenCount

        if (!document) return [];
        const children = await this.fieldDatastore.find({constraints: {
                'liesWithin:contain' : document.resource.id
            }});
        this.children = children.documents;
    }


    public jumpToView(document: FieldDocument) {

        this.closeListPopover();
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

        this.closeListPopover();
        await this.routingService.jumpToResource(documentToSelect, 'relations');
        this.resourcesComponent.setScrollTarget(documentToSelect);
    }


    // public moveInto(document: FieldDocument) {
    //
    //     this.closeListPopover();
    //     this.navigationService.moveInto(document);
    // }


    public async moveIntoAndSelect(document: FieldDocument) {

        this.closeListPopover();
        const selectedDocument = this.viewFacade.getSelectedDocument();
        if (!selectedDocument) return;
        await this.routingService.jumpToResource(selectedDocument);
        await this.viewFacade.setSelectedDocument(document.resource.id);
    }


    public async openPopover(document: FieldDocument|undefined) {

        if (!document) return;
        if (!this.relationsMenuOpened) this.listPopoverOpened = true;
    }


    public closeListPopover() {

        this.listPopoverOpened = false;
        this.highlightedDocument = undefined;
        this.relationsMenuOpened = false;
        this.childrenMenuOpened = false;
        this.infoMenuOpened = false;
        this.children = [];
    };


    public async openChildCollection() {

        await this.viewFacade.moveInto(this.viewFacade.getSelectedDocument());
        await this.viewFacade.deselect();
        this.closeListPopover();
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
}