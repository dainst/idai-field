import {Component, Input} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {ResourcesComponent} from '../resources.component';
import {Loading} from '../../../widgets/loading';
import {ViewFacade} from '../view/view-facade';
import {ProjectConfiguration} from 'idai-components-2/configuration';
import {NavigationService} from '../navigation-service';


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

// TODO export class SidebarListComponent extends BaseList
export class SidebarListComponent {

    @Input() activeTab: string;

    public pathToRootDocument: Array<IdaiFieldDocument>;

    constructor(
        public resourcesComponent: ResourcesComponent,
        public viewFacade: ViewFacade,
        private loading: Loading,
        private navigationService: NavigationService
    ) {
        // super(viewFacade)
        this.viewFacade.pathToRootDocumentNotifications().subscribe(path => {
            this.pathToRootDocument = path;
        })
    }


    public moveInto = (document: IdaiFieldDocument) => this.navigationService.moveInto(document);


    public showMoveIntoOption = (document: IdaiFieldDocument) => this.navigationService.showMoveIntoOption(document);


    public select(document: IdaiFieldDocument, autoScroll: boolean = false) {

        this.resourcesComponent.isEditingGeometry = false;

        if (!document) {
            this.viewFacade.deselect();
        } else {
            this.viewFacade.setSelectedDocument(document);
        }

        if (autoScroll) this.resourcesComponent.setScrollTarget(document);
    }


    // TODO Move to BaseList
    public getLastInPathToRootDocument() {

        if (this.pathToRootDocument.length > 0) return this.pathToRootDocument[this.pathToRootDocument.length - 1];
    }

    
    // TODO Move to BaseList
    public showPlusButton() { // TODO check if this is a duplication with the one from resources component

        return (!this.resourcesComponent.isEditingGeometry && this.resourcesComponent.ready
            && !this.loading.showIcons && this.viewFacade.getQuery().q == ''
            && (this.viewFacade.isInOverview() || this.viewFacade.getSelectedMainTypeDocument()));
    }
}