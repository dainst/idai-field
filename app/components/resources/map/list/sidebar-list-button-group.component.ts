import {Component, Input} from '@angular/core';
import {FieldDocument} from 'idai-components-2';
import {SidebarListComponent} from './sidebar-list.component';
import {ViewFacade} from '../../view/view-facade';
import {TypeUtility} from '../../../../core/model/type-utility';
import {NavigationService} from '../../navigation/navigation-service';
import {RoutingService} from '../../../routing-service';
import {ResourcesComponent} from '../../resources.component';


@Component({
    selector: 'sidebar-list-button-group',
    moduleId: module.id,
    templateUrl: './sidebar-list-button-group.html'
})
/**
 * @author Daniel de Oliveira
 */
export class SidebarListButtonGroupComponent {

    @Input() document: FieldDocument;

    constructor(private resourcesComponent: ResourcesComponent,
                public sidebarList: SidebarListComponent,
                public viewFacade: ViewFacade,
                public typeUtility: TypeUtility,
                private routingService: RoutingService,
                private navigationService: NavigationService) {
    }


    public shouldShowArrowUpForSearchMode = () => this.navigationService.shouldShowArrowUpForSearchMode(this.document);

    public shouldShowArrowTopRight = () => this.navigationService.shouldShowArrowTopRight(this.document);

    public shouldShowArrowTopRightForSearchMode = () => this.navigationService.shouldShowArrowTopRightForSearchMode(this.document);

    public jumpToResourceInSameView = () => this.navigationService.jumpToResourceInSameView(this.document);

    public shouldShowArrowBottomRight = () => this.navigationService.shouldShowArrowBottomRight(this.document);

    public jumpToView = () => this.navigationService.jumpToView(this.document);


    public async jumpToResourceFromOverviewToOperation() { // arrow top right, when in search

        this.sidebarList.closePopover();
        await this.routingService.jumpToResource(this.document);
        await this.viewFacade.setBypassHierarchy(false);
        await this.routingService.jumpToResource(this.document);
        this.resourcesComponent.setScrollTarget(this.document);
    }
}