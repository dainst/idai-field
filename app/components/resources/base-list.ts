import {ResourcesComponent} from './resources.component';
import {Loading} from '../widgets/loading';
import {PlusButtonStatus} from './plus-button.component';
import {NavigationPath} from '../../core/resources/view/state/navigation-path';
import {ViewFacade} from '../../core/resources/view/view-facade';

/**
 * @author Philipp Gerth
 * @author Thomas Kleinke
 */
export class BaseList {

    public navigationPath: NavigationPath;


    constructor(public resourcesComponent: ResourcesComponent,
                public viewFacade: ViewFacade,
                protected loading: Loading) {

        this.navigationPath = this.viewFacade.getNavigationPath();
        this.viewFacade.navigationPathNotifications().subscribe(path => this.navigationPath = path);
    }


    public getCurrentFilterType()  {

        const filterTypes = this.viewFacade.getFilterTypes();
        return filterTypes && filterTypes.length > 0 ? filterTypes[0] : undefined;
    }


    public getSelectedSegmentDoc() {

        const segment = NavigationPath.getSelectedSegment(this.navigationPath);
        return segment ? segment.document : undefined;
    }


    public isPlusButtonShown(): boolean {

        return !this.resourcesComponent.isEditingGeometry
            && this.viewFacade.isReady()
            && (!this.loading.isLoading() || this.loading.getContext() !== undefined);
    }


    public getPlusButtonStatus(): PlusButtonStatus {

        if (this.viewFacade.isInExtendedSearchMode()) {
            return 'disabled-hierarchy';
        } else {
            return 'enabled';
        }
    }
}