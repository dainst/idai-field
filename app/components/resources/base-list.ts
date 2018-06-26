import {ResourcesComponent} from './resources.component';
import {ViewFacade} from './state/view-facade';
import {Loading} from '../../widgets/loading';
import {FlatNavigationPath} from './state/navpath/flat-navigation-path';

/**
 * A base class for all lists, e.g. sidebarList and List components
 *
 * @author Philipp Gerth
 */

export class BaseList {

    public navigationPath: FlatNavigationPath = { segments: [] };

    constructor(
        public resourcesComponent: ResourcesComponent,
        public viewFacade: ViewFacade,
        private loading: Loading
    ) {
        this.viewFacade.navigationPathNotifications().subscribe(path => {
            this.navigationPath = path;
        });
    }


    public showPlusButton(): boolean {

        return (!this.resourcesComponent.isEditingGeometry && this.resourcesComponent.ready
            && !this.loading.showIcons && (this.viewFacade.getQueryString() === '')
            && (this.viewFacade.isInOverview() || (
                    this.viewFacade.getSelectedOperationTypeDocument() !== undefined
                    && this.viewFacade.getDisplayHierarchy()
                )
            )
        );
    }
}