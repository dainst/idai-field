import {Document} from 'idai-components-2';
import {ResourcesComponent} from './resources.component';
import {ViewFacade} from './view/view-facade';
import {Loading} from '../../widgets/loading';
import {NavigationPath} from './view/state/navigation-path';
import {PlusButtonStatus} from './plus-button.component';

/**
 * @author Philipp Gerth
 * @author Thomas Kleinke
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
            && !this.loading.isLoading()
            && (this.viewFacade.isInOverview()
                || this.viewFacade.getSelectedOperations().length > 0);
    }


    public getPlusButtonStatus(): PlusButtonStatus {

        if (this.viewFacade.getBypassHierarchy()) {
            return 'disabled-hierarchy';
        } else {
            return 'enabled';
        }
    }


    public isDocumentLimitExceeded(): boolean {

        const documents: Array<Document> = this.viewFacade.getDocuments();

        return documents
            && documents.length > 0
            && this.viewFacade.getTotalDocumentCount() > documents.length;
    }
}