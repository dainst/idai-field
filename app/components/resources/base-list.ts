import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {ResourcesComponent} from './resources.component';
import {ViewFacade} from './view/view-facade';
import {Loading} from '../../widgets/loading';

/**
 * A base class for all lists, e.g. sidebarList and List components
 *
 * @author Philipp Gerth
 */

export class BaseList {

    public pathToRootDocument: Array<IdaiFieldDocument>;

    constructor(
        public resourcesComponent: ResourcesComponent,
        public viewFacade: ViewFacade,
        public loading: Loading
    ) {
        this.viewFacade.pathToRootDocumentNotifications().subscribe(path => {
            this.pathToRootDocument = path;
        })
    }


    public getLastInPathToRootDocument() {

        if (this.pathToRootDocument.length > 0) return this.pathToRootDocument[this.pathToRootDocument.length - 1];
    }


    public showPlusButton() {

        return (!this.resourcesComponent.isEditingGeometry && this.resourcesComponent.ready
            && !this.loading.showIcons && this.viewFacade.getQuery().q == ''
            && (this.viewFacade.isInOverview() || this.viewFacade.getSelectedMainTypeDocument()));
    }

}