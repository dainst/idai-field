import {Component, Input} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {ResourcesComponent} from '../resources.component';
import {Loading} from '../../../widgets/loading';
import {ViewFacade} from '../view/view-facade';
import {RoutingService} from '../../routing-service';
import {ProjectConfiguration, RelationDefinition} from "idai-components-2/configuration";

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
export class SidebarListComponent {

    @Input() activeTab: string;

    constructor(
        public resourcesComponent: ResourcesComponent,
        public viewFacade: ViewFacade,
        private routingService: RoutingService,
        private loading: Loading,
        private projectConfiguration: ProjectConfiguration
    ) { }


    // TODO rename, probably move all this code to RoutingService, since it is also used from the ListComponent
    public jumpToMainTypeHomeView(document: IdaiFieldDocument) {

        if (this.viewFacade.isInOverview()) {
            this.routingService.jumpToMainTypeHomeView(document);
        } else {
            this.viewFacade.setRootDocument(document.resource.id as string);
        }
    }


    // TODO probably move all this code to RoutingService, since it is also used from the ListComponent, and RoutingService has already the ProjectConfiguration dependency
    public showMoveIntoOption(document: IdaiFieldDocument): boolean {

        if (this.viewFacade.isInOverview()) return true;

        const relationNames = (this.projectConfiguration.getRelationDefinitions(document.resource.type, true) as any) // TODO make that it does never return undefined
            .map((rd: RelationDefinition) => rd.name);
        
        return (relationNames.indexOf('liesWithin') !== -1);
    }



    public select(document: IdaiFieldDocument, autoScroll: boolean = false) {

        this.resourcesComponent.isEditingGeometry = false;

        if (!document) {
            this.viewFacade.deselect();
        } else {
            this.viewFacade.setSelectedDocument(document);
        }

        if (autoScroll) this.resourcesComponent.setScrollTarget(document);
    }


    public showPlusButton() { // TODO check if this is a duplication with the one from resources component

        return (!this.resourcesComponent.isEditingGeometry && this.resourcesComponent.ready
            && !this.loading.showIcons && this.viewFacade.getQuery().q == ''
            && (this.viewFacade.isInOverview() || this.viewFacade.getSelectedMainTypeDocument()));
    }
}