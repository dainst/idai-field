import {ResourcesComponent} from './resources.component';
import {ViewFacade} from './state/view-facade';
import {Loading} from '../../widgets/loading';
import {NavigationPath} from './state/state/navigation-path';

/**
 * A base class for all lists, e.g. sidebarList and List components
 *
 * @author Philipp Gerth
 */

export class BaseList {

    public navigationPath: NavigationPath = NavigationPath.empty();

    constructor(
        public resourcesComponent: ResourcesComponent,
        public viewFacade: ViewFacade,
        private loading: Loading
    ) {
        this.viewFacade.navigationPathNotifications().subscribe(path => {
            this.navigationPath = path;
        });
    }


    public getSelectedSegmentDoc() {

        const segment = NavigationPath.getSelectedSegment(this.navigationPath);
        return segment ? segment.document : undefined;
    }


    // TODO unit test this
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