import {Component, Input} from '@angular/core';
import {ResourcesComponent} from './resources.component';
import {Loading} from '../widgets/loading';
import {ViewFacade} from './view/view-facade';
import {IdaiFieldDocument, IdaiFieldGeometry} from 'idai-components-2/idai-field-model';

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
        public loading: Loading,
        public resourcesComponent: ResourcesComponent,
        public viewFacade: ViewFacade
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
        && (this.viewFacade.isInOverview() || this.viewFacade.getSelectedOperationTypeDocument()));
    }
}