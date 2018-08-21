import {Component, Input} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2';
import {ResourcesComponent} from '../../resources.component';
import {Loading} from '../../../../widgets/loading';
import {ViewFacade} from '../../view/view-facade';
import {NavigationService} from '../../navigation/navigation-service';
import {BaseList} from '../../base-list';


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

    constructor(
        resourcesComponent: ResourcesComponent,
        viewFacade: ViewFacade,
        loading: Loading,
        private navigationService: NavigationService
    ) {
        super(resourcesComponent, viewFacade, loading)
    }


    public moveInto = (document: IdaiFieldDocument) => this.navigationService.moveInto(document);

    public showMoveIntoOption = (document: IdaiFieldDocument) => this.navigationService.showMoveIntoOption(document);


    public async select(document: IdaiFieldDocument, autoScroll: boolean = false) {

        this.resourcesComponent.isEditingGeometry = false;

        if (!document) {
            this.viewFacade.deselect();
        } else {
            await this.viewFacade.setSelectedDocument(document.resource.id);
        }

        if (autoScroll) this.resourcesComponent.setScrollTarget(document);
    }
}