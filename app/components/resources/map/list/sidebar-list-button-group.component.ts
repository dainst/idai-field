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


    public shouldShowArrowTopRightForTrench = () => this.navigationService.shouldShowArrowTopRightForTrench(this.document);

    public shouldShowArrowTopRight = () => this.navigationService.shouldShowArrowTopRight(this.document);


    public jumpToViewFromOverview() { // arrow top right

        this.sidebarList.closePopover();
        this.navigationService.jumpToView(this.document)
    }


    public jumpToMatrix() {

        this.navigationService.jumpToMatrix(this.document);
    }


    public async jumpToResourceInSameView() { // arrow up

        await this.viewFacade.setBypassHierarchy(false);
        await this.routingService.jumpToResource(this.document);
    }


    public async jumpToResourceFromOverviewToOperation() { // arrow top right, when in search

        this.sidebarList.closePopover();
        await this.routingService.jumpToResource(this.document);
        await this.viewFacade.setBypassHierarchy(false);
        await this.routingService.jumpToResource(this.document);
        this.resourcesComponent.setScrollTarget(this.document);
    }


    public shouldShowArrowUp() {

        return (!this.viewFacade.isInOverview() && this.viewFacade.getBypassHierarchy())
            || (this.viewFacade.isInOverview() && this.viewFacade.getBypassHierarchy()
                && (this.typeUtility.isSubtype(this.document.resource.type, 'Operation') || this.document.resource.type === 'Place'))
    }


    public shouldShowArrowTopRightForSearchMode() {

        return (this.viewFacade.isInOverview() && this.viewFacade.getBypassHierarchy()
            && (!this.typeUtility.isSubtype(this.document.resource.type, 'Operation') && this.document.resource.type !== 'Place'));
    }
}