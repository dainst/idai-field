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

    public popoverOpened = false;
    public highlightedDocument: FieldDocument|undefined = undefined;
    public timeoutRunning = false;


    constructor(resourcesComponent: ResourcesComponent,
                viewFacade: ViewFacade,
                loading: Loading,
                private navigationService: NavigationService,
                private resourcesMapComponent: ResourcesMapComponent,
                private projectConfiguration: ProjectConfiguration,
                private routingService: RoutingService,) {

        super(resourcesComponent, viewFacade, loading)
    }


    public jumpToMatrix = (document: FieldDocument) => this.navigationService.jumpToMatrix(document);

    public showMoveIntoOption = (document: FieldDocument) =>
        this.navigationService.showMoveIntoOption(document);

    public showJumpToViewOption = (document: FieldDocument) =>
        this.navigationService.showJumpToViewOption(document);

    public openContextMenu = (event: MouseEvent, document: FieldDocument) =>
        this.resourcesMapComponent.openContextMenu(event, document);

    public closeContextMenu = () => this.resourcesMapComponent.closeContextMenu();


    public moveInto(document: FieldDocument) {

        this.closePopover();
        this.navigationService.moveInto(document);
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


    public openPopover(document: FieldDocument) {

        if (document) this.highlightedDocument = document;
        this.popoverOpened = true;
        this.timeoutRunning = false;
    }

    public closePopover() {

        this.timeoutRunning = true;
        setTimeout(async () => {

            if (this.timeoutRunning) {
                this.popoverOpened = false;
                this.highlightedDocument = undefined;
                this.timeoutRunning = false;
            }
        }, 50);
    };

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