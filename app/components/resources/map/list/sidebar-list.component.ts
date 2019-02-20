import {Component, Input} from '@angular/core';
import {FieldDocument} from 'idai-components-2';
import {ResourcesComponent} from '../../resources.component';
import {Loading} from '../../../../widgets/loading';
import {ViewFacade} from '../../view/view-facade';
import {NavigationService} from '../../navigation/navigation-service';
import {BaseList} from '../../base-list';
import {ResourcesMapComponent} from '../resources-map.component';


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


    constructor(resourcesComponent: ResourcesComponent,
                viewFacade: ViewFacade,
                loading: Loading,
                private navigationService: NavigationService,
                private resourcesMapComponent: ResourcesMapComponent) {

        super(resourcesComponent, viewFacade, loading)
    }


    public moveInto = (document: FieldDocument) => this.navigationService.moveInto(document);

    public jumpToView = (document: FieldDocument) => this.navigationService.jumpToView(document);

    public showMoveIntoOption = (document: FieldDocument) =>
        this.navigationService.showMoveIntoOption(document);

    public showJumpToViewOption = (document: FieldDocument) =>
        this.navigationService.showJumpToViewOption(document);

    public openContextMenu = (event: MouseEvent, document: FieldDocument) =>
        this.resourcesMapComponent.openContextMenu(event, document);

    public closeContextMenu = () => this.resourcesMapComponent.closeContextMenu();


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