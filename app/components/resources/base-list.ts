import {Document} from 'idai-components-2/core';
import {ResourcesComponent} from './resources.component';
import {ViewFacade} from './view/view-facade';
import {Loading} from '../../widgets/loading';
import {NavigationPath} from './view/state/navigation-path';

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
    public showPlusButton(): boolean {

        return (!this.resourcesComponent.isEditingGeometry && this.resourcesComponent.ready
            && !this.loading.showIcons && (this.viewFacade.getSearchString() === '')
            && (this.viewFacade.isInOverview() || (
                    this.viewFacade.getSelectedOperationTypeDocument() !== undefined
                    && this.viewFacade.getDisplayHierarchy()
                )
            )
        );
    }


    public isDocumentLimitExceeded(): boolean {

        const documents: Array<Document> = this.viewFacade.getDocuments();

        return documents
            && documents.length > 0
            && this.viewFacade.getTotalDocumentCount() > documents.length;
    }
}