import {Document} from 'idai-components-2/core';
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


    public getSelectedSegmentDoc() {

        const segment = NavigationPath.getSelectedSegment(this.navigationPath);
        return segment ? segment.document : undefined;
    }


    // TODO unit test this
    public isPlusButtonShown(): boolean {

        return !this.resourcesComponent.isEditingGeometry
            && this.resourcesComponent.ready
            && !this.loading.isLoading()
            && (this.viewFacade.isInOverview()
                || this.viewFacade.getSelectedOperationTypeDocument() !== undefined);
    }


    // TODO unit test this
    public getPlusButtonStatus(): PlusButtonStatus {

        if (!this.viewFacade.getDisplayHierarchy()) {
            return 'disabled-hierarchy';
        } else if (this.viewFacade.getSearchString() !== '') {
            return 'disabled-search';
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