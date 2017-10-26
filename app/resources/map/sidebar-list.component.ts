import {Component, Input} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {ResourcesComponent} from '../resources.component';
import {Loading} from '../../widgets/loading';
import {ViewFacade} from '../view/view-facade';
import {RoutingService} from '../../common/routing-service';
import {ResourcesMapComponent} from './resources-map.component';

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

    // for clean and refactor safe template, and to help find usages
    public jumpToMainTypeHomeView = (document: IdaiFieldDocument) =>
        this.routingService.jumpToMainTypeHomeView(document);



    constructor(
        public resourcesComponent: ResourcesComponent,
        public mapWrapperComponent: ResourcesMapComponent,    // TODO Check if it's possible to get rid of the dependency
        public viewFacade: ViewFacade,
        private routingService: RoutingService,
        private loading: Loading
    ) { }


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